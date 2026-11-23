const express = require("express");
const { z } = require("zod");
const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const validate = require("../../middleware/validate");
const { newsletterSignup } = require("../../middleware/apiRateLimit");

const router = express.Router();

const newsletterBodySchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  full_name: z.string().trim().max(160).optional().nullable(),
}).strict();

/* ============================================================================
 * 1. PUBLISHED FAQs  (GET /api/public/faqs)
 * ========================================================================== */
router.get(
  "/faqs",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      `SELECT id, category, question, answer, sort_order
         FROM faqs
        WHERE status = 'published'
        ORDER BY category ASC, sort_order ASC, id ASC`
    );
    return sendSuccess(res, rows);
  })
);

/* ============================================================================
 * 2. FEATURED TESTIMONIALS  (GET /api/public/testimonials)
 * ========================================================================== */
router.get(
  "/testimonials",
  asyncHandler(async (req, res) => {
    const featuredOnly = req.query.featured !== "0";
    const [rows] = await pool.execute(
      `SELECT id, author_name, author_location, tour_title, rating, quote, avatar_url, is_featured
         FROM testimonials
        WHERE status = 'published' ${featuredOnly ? "AND is_featured = 1" : ""}
        ORDER BY is_featured DESC, id DESC
        LIMIT 12`
    );
    return sendSuccess(res, rows);
  })
);

/* ============================================================================
 * 3. CMS PAGES  (GET /api/public/pages/:slug)
 * ========================================================================== */
router.get(
  "/pages/:slug",
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const [[page]] = await pool.execute(
      `SELECT id, slug, title, body, seo_title, seo_description, updated_at
         FROM cms_pages
        WHERE slug = ? AND status = 'published'
        LIMIT 1`,
      [slug]
    );
    if (!page) throw AppError.notFound("Page not found.");
    return sendSuccess(res, page);
  })
);

/* ============================================================================
 * 4. ACTIVE TOUR ADD-ONS  (GET /api/public/tours/:tourId/addons)
 * ========================================================================== */
router.get(
  "/tours/:tourId/addons",
  asyncHandler(async (req, res) => {
    const tourId = Number(req.params.tourId);
    if (!tourId) throw AppError.badRequest("Invalid tourId.", "VALIDATION_ERROR");

    const [rows] = await pool.execute(
      `SELECT id, tour_id, name, description, price, pricing_mode
         FROM tour_addons
        WHERE tour_id = ? AND is_active = 1
        ORDER BY id ASC`,
      [tourId]
    );
    return sendSuccess(res, rows);
  })
);

/* ============================================================================
 * 5. PUBLIC NEWSLETTER SIGNUP  (POST /api/public/newsletter)
 * ========================================================================== */
router.post(
  "/newsletter",
  newsletterSignup,
  validate({ body: newsletterBodySchema }),
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const fullName = req.body.full_name ? String(req.body.full_name).trim().slice(0, 160) : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw AppError.badRequest("Please enter a valid email address.", "VALIDATION_ERROR");
    }

    await pool.execute(
      `INSERT INTO newsletter_subscribers (email, full_name, status)
       VALUES (?, ?, 'subscribed')
       ON DUPLICATE KEY UPDATE
         full_name = COALESCE(VALUES(full_name), full_name),
         status = 'subscribed'`,
      [email, fullName]
    );

    return sendSuccess(res, { subscribed: true }, { status: 201 });
  })
);

module.exports = router;