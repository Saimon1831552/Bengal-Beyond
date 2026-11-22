const express = require("express");
const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();
router.use(authenticate);

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ============================================================================
 * 1. FAQs  (/api/admin/faqs)
 * ========================================================================== */
router.get(
  "/faqs",
  authorize("content.manage"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      `SELECT * FROM faqs ORDER BY sort_order ASC, id DESC`
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/faqs",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const { category = "General", question, answer, sort_order = 0, status = "published" } = req.body;
    if (!question || !answer) {
      throw AppError.badRequest("question and answer are required.", "VALIDATION_ERROR");
    }
    const [result] = await pool.execute(
      `INSERT INTO faqs (category, question, answer, sort_order, status) VALUES (?, ?, ?, ?, ?)`,
      [String(category).trim() || "General", String(question).trim(), String(answer).trim(), Number(sort_order) || 0, status === "draft" ? "draft" : "published"]
    );
    const [[created]] = await pool.execute(`SELECT * FROM faqs WHERE id = ?`, [result.insertId]);
    return sendSuccess(res, created, { status: 201 });
  })
);

router.patch(
  "/faqs/:id",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { category, question, answer, sort_order, status } = req.body;
    const fields = [];
    const params = [];

    if (category !== undefined) { fields.push("category = ?"); params.push(String(category).trim()); }
    if (question !== undefined) { fields.push("question = ?"); params.push(String(question).trim()); }
    if (answer !== undefined) { fields.push("answer = ?"); params.push(String(answer).trim()); }
    if (sort_order !== undefined) { fields.push("sort_order = ?"); params.push(Number(sort_order) || 0); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE faqs SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("FAQ not found.");
    return sendSuccess(res, { updated: true });
  })
);

router.delete(
  "/faqs/:id",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM faqs WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("FAQ not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 2. TESTIMONIALS  (/api/admin/testimonials)
 * ========================================================================== */
router.get(
  "/testimonials",
  authorize("content.manage"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM testimonials ORDER BY is_featured DESC, id DESC`);
    return sendSuccess(res, rows);
  })
);

router.post(
  "/testimonials",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const {
      author_name,
      author_location = null,
      tour_title = null,
      rating = 5,
      quote,
      avatar_url = null,
      is_featured = 1,
      status = "published",
    } = req.body;

    if (!author_name || !quote) {
      throw AppError.badRequest("author_name and quote are required.", "VALIDATION_ERROR");
    }
    const [result] = await pool.execute(
      `INSERT INTO testimonials (author_name, author_location, tour_title, rating, quote, avatar_url, is_featured, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(author_name).trim(),
        author_location || null,
        tour_title || null,
        Math.min(5, Math.max(1, Number(rating) || 5)),
        String(quote).trim(),
        avatar_url || null,
        is_featured ? 1 : 0,
        status === "draft" ? "draft" : "published",
      ]
    );
    const [[created]] = await pool.execute(`SELECT * FROM testimonials WHERE id = ?`, [result.insertId]);
    return sendSuccess(res, created, { status: 201 });
  })
);

router.patch(
  "/testimonials/:id",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { author_name, author_location, tour_title, rating, quote, avatar_url, is_featured, status } = req.body;
    const fields = [];
    const params = [];

    if (author_name !== undefined) { fields.push("author_name = ?"); params.push(String(author_name).trim()); }
    if (author_location !== undefined) { fields.push("author_location = ?"); params.push(author_location || null); }
    if (tour_title !== undefined) { fields.push("tour_title = ?"); params.push(tour_title || null); }
    if (rating !== undefined) { fields.push("rating = ?"); params.push(Math.min(5, Math.max(1, Number(rating) || 5))); }
    if (quote !== undefined) { fields.push("quote = ?"); params.push(String(quote).trim()); }
    if (avatar_url !== undefined) { fields.push("avatar_url = ?"); params.push(avatar_url || null); }
    if (is_featured !== undefined) { fields.push("is_featured = ?"); params.push(is_featured ? 1 : 0); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE testimonials SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Testimonial not found.");
    return sendSuccess(res, { updated: true });
  })
);

router.delete(
  "/testimonials/:id",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM testimonials WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Testimonial not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 3. CMS PAGES & SEO  (/api/admin/pages)
 * ========================================================================== */
router.get(
  "/pages",
  authorize("content.manage"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM cms_pages ORDER BY title ASC`);
    return sendSuccess(res, rows);
  })
);

router.post(
  "/pages",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const { title, slug, body, seo_title = null, seo_description = null, status = "published" } = req.body;
    if (!title || !body) {
      throw AppError.badRequest("title and body are required.", "VALIDATION_ERROR");
    }
    const finalSlug = slugify(slug || title);
    try {
      const [result] = await pool.execute(
        `INSERT INTO cms_pages (slug, title, body, seo_title, seo_description, status, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [finalSlug, String(title).trim(), String(body), seo_title || null, seo_description || null, status === "draft" ? "draft" : "published", req.auth.userId]
      );
      const [[created]] = await pool.execute(`SELECT * FROM cms_pages WHERE id = ?`, [result.insertId]);
      return sendSuccess(res, created, { status: 201 });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") throw AppError.conflict("A page with this slug already exists.");
      throw err;
    }
  })
);

router.patch(
  "/pages/:id",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { title, slug, body, seo_title, seo_description, status } = req.body;
    const fields = ["updated_by = ?"];
    const params = [req.auth.userId];

    if (title !== undefined) { fields.push("title = ?"); params.push(String(title).trim()); }
    if (slug !== undefined) { fields.push("slug = ?"); params.push(slugify(slug)); }
    if (body !== undefined) { fields.push("body = ?"); params.push(String(body)); }
    if (seo_title !== undefined) { fields.push("seo_title = ?"); params.push(seo_title || null); }
    if (seo_description !== undefined) { fields.push("seo_description = ?"); params.push(seo_description || null); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }

    params.push(id);
    const [result] = await pool.execute(`UPDATE cms_pages SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Page not found.");
    return sendSuccess(res, { updated: true });
  })
);

router.delete(
  "/pages/:id",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM cms_pages WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Page not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 4. CUSTOM TOUR ENQUIRIES  (/api/admin/custom-enquiries)
 * Uses existing `tour_enquiries` table
 * ========================================================================== */
const ENQUIRY_STATUSES = ["new", "assigned", "in_progress", "awaiting_customer", "converted", "closed", "rejected"];

router.get(
  "/custom-enquiries",
  authorize("enquiries.manage"),
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.status) {
      where.push("e.status = ?");
      params.push(req.query.status);
    }
    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `SELECT e.*, assignee.full_name AS assigned_to_name
         FROM tour_enquiries e
         LEFT JOIN users assignee ON assignee.id = e.assigned_to
        ${sqlWhere}
        ORDER BY FIELD(e.status, 'new', 'assigned', 'in_progress', 'awaiting_customer', 'converted', 'closed', 'rejected'), e.created_at DESC`,
      params
    );
    return sendSuccess(res, rows);
  })
);

router.patch(
  "/custom-enquiries/:id",
  authorize("enquiries.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status, assigned_to } = req.body;
    const fields = [];
    const params = [];

    if (status !== undefined) {
      if (!ENQUIRY_STATUSES.includes(status)) {
        throw AppError.badRequest("Invalid enquiry status.", "VALIDATION_ERROR");
      }
      fields.push("status = ?");
      params.push(status);
    }
    if (assigned_to !== undefined) {
      fields.push("assigned_to = ?");
      params.push(assigned_to ? Number(assigned_to) : null);
    }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE tour_enquiries SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Custom tour enquiry not found.");
    return sendSuccess(res, { updated: true });
  })
);

/* ============================================================================
 * 5. CUSTOMER GROUPS  (/api/admin/customer-groups)
 * ========================================================================== */
router.get(
  "/customer-groups",
  authorize("customers.read"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM customer_groups ORDER BY min_bookings ASC, name ASC`);
    return sendSuccess(res, rows);
  })
);

router.post(
  "/customer-groups",
  authorize("settings.manage"),
  asyncHandler(async (req, res) => {
    const { name, description = null, discount_percent = 0, min_bookings = 0, status = "active" } = req.body;
    if (!name) throw AppError.badRequest("Group name is required.", "VALIDATION_ERROR");
    try {
      const [result] = await pool.execute(
        `INSERT INTO customer_groups (name, description, discount_percent, min_bookings, status)
         VALUES (?, ?, ?, ?, ?)`,
        [String(name).trim(), description || null, Number(discount_percent) || 0, Number(min_bookings) || 0, status === "inactive" ? "inactive" : "active"]
      );
      const [[created]] = await pool.execute(`SELECT * FROM customer_groups WHERE id = ?`, [result.insertId]);
      return sendSuccess(res, created, { status: 201 });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") throw AppError.conflict("A customer group with that name already exists.");
      throw err;
    }
  })
);

router.patch(
  "/customer-groups/:id",
  authorize("settings.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, description, discount_percent, min_bookings, status } = req.body;
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push("name = ?"); params.push(String(name).trim()); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description || null); }
    if (discount_percent !== undefined) { fields.push("discount_percent = ?"); params.push(Number(discount_percent)); }
    if (min_bookings !== undefined) { fields.push("min_bookings = ?"); params.push(Number(min_bookings)); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE customer_groups SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Customer group not found.");
    return sendSuccess(res, { updated: true });
  })
);

router.delete(
  "/customer-groups/:id",
  authorize("settings.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM customer_groups WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Customer group not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 6. NEWSLETTER SUBSCRIBERS  (/api/admin/newsletter)
 * ========================================================================== */
router.get(
  "/newsletter",
  authorize("content.manage"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC, id DESC`);
    return sendSuccess(res, rows);
  })
);

router.post(
  "/newsletter",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const { email, full_name = null } = req.body;
    if (!email || !String(email).includes("@")) {
      throw AppError.badRequest("A valid email address is required.", "VALIDATION_ERROR");
    }
    await pool.execute(
      `INSERT INTO newsletter_subscribers (email, full_name, status)
       VALUES (?, ?, 'subscribed')
       ON DUPLICATE KEY UPDATE full_name = COALESCE(VALUES(full_name), full_name), status = 'subscribed'`,
      [String(email).trim().toLowerCase(), full_name || null]
    );
    return sendSuccess(res, { subscribed: true }, { status: 201 });
  })
);

router.patch(
  "/newsletter/:id",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const status = req.body.status === "unsubscribed" ? "unsubscribed" : "subscribed";
    const [result] = await pool.execute(`UPDATE newsletter_subscribers SET status = ? WHERE id = ?`, [status, id]);
    if (!result.affectedRows) throw AppError.notFound("Subscriber not found.");
    return sendSuccess(res, { updated: true });
  })
);

/* ============================================================================
 * 7. EMAIL CAMPAIGNS  (/api/admin/campaigns)
 * Queues campaign emails into existing `notification_jobs` table
 * ========================================================================== */
router.get(
  "/campaigns",
  authorize("content.manage"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM email_campaigns ORDER BY created_at DESC, id DESC`);
    return sendSuccess(res, rows);
  })
);

router.post(
  "/campaigns",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const { name, subject, body_html, audience = "all_subscribers" } = req.body;
    if (!name || !subject || !body_html) {
      throw AppError.badRequest("name, subject, and body_html are required.", "VALIDATION_ERROR");
    }
    const [result] = await pool.execute(
      `INSERT INTO email_campaigns (name, subject, body_html, audience, status, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?)`,
      [String(name).trim(), String(subject).trim(), String(body_html), audience === "all_customers" ? "all_customers" : "all_subscribers", req.auth.userId]
    );
    const [[created]] = await pool.execute(`SELECT * FROM email_campaigns WHERE id = ?`, [result.insertId]);
    return sendSuccess(res, created, { status: 201 });
  })
);

router.post(
  "/campaigns/:id/send",
  authorize("content.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [[campaign]] = await pool.execute(`SELECT * FROM email_campaigns WHERE id = ? LIMIT 1`, [id]);
    if (!campaign) throw AppError.notFound("Campaign not found.");

    let recipients = [];
    if (campaign.audience === "all_customers") {
      const [rows] = await pool.execute(
        `SELECT DISTINCT u.id AS user_id, u.email, u.full_name
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
          WHERE r.role_key = 'customer' AND u.account_status = 'active'`
      );
      recipients = rows;
    } else {
      const [rows] = await pool.execute(
        `SELECT NULL AS user_id, email, full_name FROM newsletter_subscribers WHERE status = 'subscribed'`
      );
      recipients = rows;
    }

    for (const r of recipients) {
      const payload = JSON.stringify({
        subject: campaign.subject,
        html: campaign.body_html,
        recipientName: r.full_name || "Traveler",
      });
      await pool.execute(
        `INSERT IGNORE INTO notification_jobs (user_id, channel, recipient, template_key, payload_json, idempotency_key, status)
         VALUES (?, 'email', ?, 'marketing_campaign', ?, ?, 'queued')`,
        [r.user_id, r.email, payload, `campaign:${campaign.id}:${r.email}`]
      );
    }

    await pool.execute(
      `UPDATE email_campaigns SET status = 'queued', recipients_count = ?, sent_at = NOW() WHERE id = ?`,
      [recipients.length, campaign.id]
    );
    return sendSuccess(res, { queued: recipients.length });
  })
);

/* ============================================================================
 * 8. REFERRAL PROGRAM  (/api/admin/referrals)
 * ========================================================================== */
router.get(
  "/referrals",
  authorize("settings.manage"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.execute(
      `SELECT rc.*, u.full_name AS owner_name, u.email AS owner_email
         FROM referral_codes rc
         LEFT JOIN users u ON u.id = rc.owner_user_id
        ORDER BY rc.created_at DESC, rc.id DESC`
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/referrals",
  authorize("settings.manage"),
  asyncHandler(async (req, res) => {
    const { code, owner_user_id = null, reward_amount = 500, status = "active" } = req.body;
    if (!code) throw AppError.badRequest("Referral code is required.", "VALIDATION_ERROR");
    try {
      const [result] = await pool.execute(
        `INSERT INTO referral_codes (code, owner_user_id, reward_amount, status) VALUES (?, ?, ?, ?)`,
        [String(code).trim().toUpperCase(), owner_user_id ? Number(owner_user_id) : null, Number(reward_amount) || 0, status === "inactive" ? "inactive" : "active"]
      );
      const [[created]] = await pool.execute(`SELECT * FROM referral_codes WHERE id = ?`, [result.insertId]);
      return sendSuccess(res, created, { status: 201 });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") throw AppError.conflict("That referral code already exists.");
      throw err;
    }
  })
);

router.patch(
  "/referrals/:id",
  authorize("settings.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status, reward_amount } = req.body;
    const fields = [];
    const params = [];
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }
    if (reward_amount !== undefined) { fields.push("reward_amount = ?"); params.push(Number(reward_amount)); }
    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);
    const [result] = await pool.execute(`UPDATE referral_codes SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Referral code not found.");
    return sendSuccess(res, { updated: true });
  })
);

module.exports = router;