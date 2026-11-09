const { pool, withTransaction } = require("../../config/db");

async function list(filters) {
  const where = [];
  const params = {};
  if (filters.q) {
    where.push("(b.booking_reference LIKE :q OR b.customer_name LIKE :q OR b.customer_email LIKE :q OR b.customer_phone LIKE :q)");
    params.q = `%${filters.q}%`;
  }
  if (filters.status) { where.push("b.booking_status = :status"); params.status = filters.status; }
  if (filters.payment_status) { where.push("b.payment_status = :payment_status"); params.payment_status = filters.payment_status; }
  if (filters.date_from) { where.push("b.created_at >= :date_from"); params.date_from = `${filters.date_from} 00:00:00`; }
  if (filters.date_to) { where.push("b.created_at < DATE_ADD(:date_to, INTERVAL 1 DAY)"); params.date_to = `${filters.date_to} 00:00:00`; }
  if (filters.departure_id) { where.push("EXISTS (SELECT 1 FROM booking_items bi WHERE bi.booking_id = b.id AND bi.departure_id = :departure_id)"); params.departure_id = filters.departure_id; }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM bookings b ${clause}`, params);
  const sort = ({ created_at: "b.created_at", updated_at: "b.updated_at", total_amount: "b.total_amount" })[filters.sort];
  const order = filters.order === "asc" ? "ASC" : "DESC";
  const offset = (filters.page - 1) * filters.limit;
  const [rows] = await pool.execute(
    `SELECT b.id, b.booking_reference, b.booking_status, b.payment_status, b.customer_name, b.customer_email, b.customer_phone, b.currency_code, b.total_amount, b.created_at, b.updated_at,
      (SELECT COUNT(*) FROM booking_items bi WHERE bi.booking_id = b.id) AS item_count,
      (SELECT COALESCE(SUM(bi.quantity), 0) FROM booking_items bi WHERE bi.booking_id = b.id) AS traveler_count
     FROM bookings b ${clause} ORDER BY ${sort} ${order}, b.id ${order} LIMIT :limit OFFSET :offset`,
    { ...params, limit: filters.limit, offset }
  );
  return { rows, total: Number(total) };
}

async function findById(id) {
  const [[booking]] = await pool.execute("SELECT * FROM bookings WHERE id = ?", [id]);
  if (!booking) return null;
  const [items] = await pool.execute(
    `SELECT bi.*, t.title AS current_tour_title, td.starts_at, td.ends_at, td.status AS departure_status
     FROM booking_items bi JOIN tours t ON t.id = bi.tour_id JOIN tour_departures td ON td.id = bi.departure_id
     WHERE bi.booking_id = ? ORDER BY bi.id`, [id]);
  const [travelers] = await pool.execute("SELECT id, traveler_name, traveler_type, nationality, created_at FROM booking_travelers WHERE booking_id = ? ORDER BY id", [id]);
  const [payments] = await pool.execute("SELECT id, provider, provider_payment_id, amount, currency_code, status, verified_at, created_at, updated_at FROM payments WHERE booking_id = ? ORDER BY id DESC", [id]);
  const [history] = await pool.execute("SELECT id, previous_status, new_status, changed_by_user_id, note, created_at FROM booking_status_history WHERE booking_id = ? ORDER BY id DESC", [id]);
  const [notes] = await pool.execute("SELECT id, admin_user_id, note, visibility, created_at FROM booking_notes WHERE booking_id = ? ORDER BY id DESC", [id]);
  return { ...booking, items, travelers, payments, status_history: history, notes };
}

async function updateStatus(id, nextStatus, adminId, note) {
  return withTransaction(async (conn) => {
    const [[booking]] = await conn.execute("SELECT id, booking_status, payment_status FROM bookings WHERE id = ? FOR UPDATE", [id]);
    if (!booking) return { notFound: true };
    const allowed = {
      pending_review: ["awaiting_payment", "confirmed", "rejected", "cancelled"],
      awaiting_payment: ["confirmed", "rejected", "cancelled", "expired"],
      confirmed: ["cancellation_requested", "cancelled", "completed"],
      cancellation_requested: ["confirmed", "cancelled"],
      rejected: [], cancelled: [], completed: [], expired: [],
    };
    if (booking.booking_status === nextStatus) return { unchanged: true, status: nextStatus };
    if (!(allowed[booking.booking_status] || []).includes(nextStatus)) return { invalidTransition: true, from: booking.booking_status, to: nextStatus };
    if (nextStatus === "confirmed" && booking.payment_status !== "paid" && booking.payment_status !== "not_required") {
      return { paymentRequired: true, payment_status: booking.payment_status };
    }
    if (nextStatus === "completed" && booking.booking_status !== "confirmed") return { invalidTransition: true, from: booking.booking_status, to: nextStatus };
    const [result] = await conn.execute(
      `UPDATE bookings SET booking_status = ?, confirmed_at = CASE WHEN ? = 'confirmed' THEN UTC_TIMESTAMP() ELSE confirmed_at END,
       cancelled_at = CASE WHEN ? = 'cancelled' THEN UTC_TIMESTAMP() ELSE cancelled_at END WHERE id = ?`,
      [nextStatus, nextStatus, nextStatus, id]);
    await conn.execute(
      "INSERT INTO booking_status_history (booking_id, previous_status, new_status, changed_by_user_id, note) VALUES (?, ?, ?, ?, ?)",
      [id, booking.booking_status, nextStatus, adminId || null, note || null]);
    return { updated: result.affectedRows === 1, status: nextStatus };
  });
}

async function addNote(id, adminId, note, visibility) {
  const [[booking]] = await pool.execute("SELECT id FROM bookings WHERE id = ?", [id]);
  if (!booking) return null;
  const [result] = await pool.execute("INSERT INTO booking_notes (booking_id, admin_user_id, note, visibility) VALUES (?, ?, ?, ?)", [id, adminId, note, visibility]);
  const [[created]] = await pool.execute("SELECT id, booking_id, admin_user_id, note, visibility, created_at FROM booking_notes WHERE id = ?", [result.insertId]);
  return created;
}

module.exports = { list, findById, updateStatus, addNote };
