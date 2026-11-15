const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");
const bookingRepo = require("../bookings/admin-booking.repository");

const parse = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v || {}; } catch { return {}; } };

async function list({ status, page, limit }) {
  const where = [
    "r.request_type = 'other'",
    "JSON_UNQUOTE(JSON_EXTRACT(r.request_details, '$.category')) = 'cancellation_request'",
  ];
  const params = [];
  if (status) { where.push("r.status = ?"); params.push(status); }
  const clause = `WHERE ${where.join(" AND ")}`;
  const [[c]] = await pool.execute(`SELECT COUNT(*) AS total FROM booking_change_requests r ${clause}`, params);
  const [rows] = await pool.execute(
    `SELECT r.id, r.booking_id, r.status, r.request_details, r.created_at, r.reviewed_at,
            b.booking_reference, b.customer_name, b.customer_email, b.booking_status,
            b.payment_status, b.currency_code, b.total_amount
       FROM booking_change_requests r JOIN bookings b ON b.id = r.booking_id
       ${clause}
      ORDER BY (r.status = 'pending') DESC, r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]);
  return {
    rows: rows.map(({ request_details, ...x }) => ({ ...x, reason: parse(request_details).reason || "" })),
    total: Number(c.total),
  };
}

async function decide(id, adminId, action, note) {
  const [[r]] = await pool.execute("SELECT id, booking_id, status FROM booking_change_requests WHERE id = ?", [id]);
  if (!r) throw AppError.notFound("Request not found.", "REQUEST_NOT_FOUND");
  if (r.status !== "pending") throw AppError.conflict("This request has already been decided.");

  if (action === "approve") {
    const res = await bookingRepo.updateStatus(r.booking_id, "cancelled", adminId, note || "Cancellation request approved");
    if (res.notFound) throw AppError.notFound("Booking not found.", "BOOKING_NOT_FOUND");
    if (res.invalidTransition) throw AppError.conflict(`This booking cannot be cancelled from "${res.from}".`);
  }
  const [u] = await pool.execute(
    "UPDATE booking_change_requests SET status = ?, reviewed_by = ?, reviewed_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'pending'",
    [action === "approve" ? "approved" : "rejected", adminId, id]);
  if (!u.affectedRows) throw AppError.conflict("This request has already been decided.");
  if (action === "reject" && note) {
    await pool.execute(
      "INSERT INTO booking_notes (booking_id, admin_user_id, note, visibility) VALUES (?, ?, ?, 'customer_visible')",
      [r.booking_id, adminId, note]);
  }
  return { id, status: action === "approve" ? "approved" : "rejected" };
}

module.exports = { list, decide };