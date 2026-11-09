const { pool, withTransaction } = require("../../config/db");
function err(message, statusCode) { const e = new Error(message); e.statusCode = statusCode; throw e; }

async function listPublished(tourId, { page, limit, offset }) {
  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) AS total, COALESCE(ROUND(AVG(rating), 2), 0) AS averageRating
     FROM tour_reviews WHERE tour_id = ? AND status = 'published'`, [tourId]);
  const [rows] = await pool.execute(
    `SELECT id, reviewer_name AS reviewerName, rating, review_text AS reviewText,
      admin_reply AS adminReply, created_at AS createdAt
     FROM tour_reviews WHERE tour_id = ? AND status = 'published'
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [tourId, limit, offset]);
  const total = Number(summary.total);
  return { items: rows, summary: { total, averageRating: Number(summary.averageRating) },
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}
async function submit({ tourId, bookingId, userId, rating, reviewText }) {
  return withTransaction(async (conn) => {
    const [[booking]] = await conn.execute(
      `SELECT b.id, b.user_id, b.booking_status, bi.tour_id
       FROM bookings b JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.id = ? AND bi.tour_id = ? FOR UPDATE`, [bookingId, tourId]);
    if (!booking) err("Booking does not contain this tour", 404);
    if (booking.user_id !== userId) err("This booking does not belong to the authenticated customer", 403);
    if (booking.booking_status !== "completed") err("A review can be submitted only after the booking is completed", 409);
    const [[existing]] = await conn.execute(
      "SELECT id FROM tour_reviews WHERE booking_id = ? AND tour_id = ? LIMIT 1 FOR UPDATE",
      [bookingId, tourId]);
    if (existing) err("A review has already been submitted for this booking and tour", 409);
    const [[user]] = await conn.execute("SELECT full_name FROM users WHERE id = ?", [userId]);
    if (!user) err("Customer account not found", 404);
    const [result] = await conn.execute(
      `INSERT INTO tour_reviews
        (tour_id, booking_id, user_id, reviewer_name, rating, review_text, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [tourId, bookingId, userId, user.full_name, rating, reviewText]);
    const [[created]] = await conn.execute(
      `SELECT id, tour_id AS tourId, rating, review_text AS reviewText, status, created_at AS createdAt
       FROM tour_reviews WHERE id = ?`, [result.insertId]);
    return created;
  });
}
async function adminList({ status, page, limit, offset }) {
  const params = [];
  const where = [];
  if (status) { where.push("r.status = ?"); params.push(status); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM tour_reviews r ${clause}`, params);
  const [rows] = await pool.execute(
    `SELECT r.id, r.tour_id AS tourId, t.title AS tourTitle, r.booking_id AS bookingId,
      r.user_id AS userId, r.reviewer_name AS reviewerName, r.rating,
      r.review_text AS reviewText, r.status, r.admin_reply AS adminReply,
      r.moderated_by AS moderatedBy, r.moderated_at AS moderatedAt, r.created_at AS createdAt
     FROM tour_reviews r JOIN tours t ON t.id = r.tour_id ${clause}
     ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC
     LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const total = Number(count.total);
  return { items: rows, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}
async function moderate(reviewId, changes, moderatorId) {
  return withTransaction(async (conn) => {
    const [[review]] = await conn.execute("SELECT id FROM tour_reviews WHERE id = ? FOR UPDATE", [reviewId]);
    if (!review) err("Review not found", 404);
    const fields = [], values = [];
    if (changes.status !== undefined) { fields.push("status = ?"); values.push(changes.status); }
    if (changes.adminReply !== undefined) { fields.push("admin_reply = ?"); values.push(changes.adminReply); }
    fields.push("moderated_by = ?", "moderated_at = UTC_TIMESTAMP()");
    values.push(moderatorId, reviewId);
    await conn.execute(`UPDATE tour_reviews SET ${fields.join(", ")} WHERE id = ?`, values);
    const [[updated]] = await conn.execute(
      `SELECT id, tour_id AS tourId, rating, review_text AS reviewText, status,
        admin_reply AS adminReply, moderated_by AS moderatedBy, moderated_at AS moderatedAt
       FROM tour_reviews WHERE id = ?`, [reviewId]);
    return updated;
  });
}
module.exports = { listPublished, submit, adminList, moderate };
