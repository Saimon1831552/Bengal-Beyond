const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const { pool } = require("../../config/db");

const router = express.Router();

// "Amelia Rahman" -> "Amelia R." (never expose full customer names publicly)
const shortName = (n) => {
  const p = String(n || "Traveller").trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0];
};

router.get("/", asyncHandler(async (req, res) => {
  const [reviews] = await pool.execute(
    `SELECT r.id, r.reviewer_name, r.rating, r.review_text, t.title AS tour_title, t.slug AS tour_slug
       FROM tour_reviews r JOIN tours t ON t.id = r.tour_id
      WHERE r.status = 'published' AND r.rating >= 4
        AND r.review_text IS NOT NULL AND r.review_text <> ''
        AND t.status = 'published' AND t.deleted_at IS NULL
      ORDER BY r.created_at DESC LIMIT 9`);
  const [[tr]] = await pool.execute(
    `SELECT COALESCE(SUM(bi.quantity), 0) AS travellers
       FROM booking_items bi JOIN bookings b ON b.id = bi.booking_id
      WHERE b.booking_status IN ('confirmed', 'completed')`);
  const [[tc]] = await pool.execute("SELECT COUNT(*) AS c FROM tours WHERE status = 'published' AND deleted_at IS NULL");
  const [[rv]] = await pool.execute(
    "SELECT COUNT(*) AS c, COALESCE(ROUND(AVG(rating), 1), 0) AS avg FROM tour_reviews WHERE status = 'published'");

  res.set("Cache-Control", "public, max-age=120");
  return sendSuccess(res, {
    reviews: reviews.map((r) => ({ id: r.id, name: shortName(r.reviewer_name), rating: r.rating, text: r.review_text, tourTitle: r.tour_title, tourSlug: r.tour_slug })),
    stats: { travellers: Number(tr.travellers), tours: Number(tc.c), reviews: Number(rv.c), averageRating: Number(rv.avg) },
  });
}));
module.exports = router;