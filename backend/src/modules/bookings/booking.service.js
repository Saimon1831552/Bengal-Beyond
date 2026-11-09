const crypto = require("crypto");
const db = require("../../config/db");
function holdMinutes() {
  const n = Number.parseInt(process.env.BOOKING_HOLD_MINUTES, 10);
  return Number.isInteger(n) ? Math.min(60, Math.max(5, n)) : 15;
}
function appError(statusCode, message) { const e = new Error(message); e.statusCode = statusCode; return e; }
function bookingRef() { return `BB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`; }
function payloadHash(p) {
  return crypto.createHash("sha256").update(JSON.stringify({
    departure_id: p.departureId, quantity: p.quantity, travelers: p.travelers
  })).digest("hex");
}
async function createBooking(p) {
  const hash = payloadHash(p);
  const c = await db.pool.getConnection();
  try {
    await c.beginTransaction();
    const [prior] = await c.query(
      "SELECT request_hash, booking_id FROM booking_idempotency_keys WHERE user_id=? AND idempotency_key=? LIMIT 1 FOR UPDATE",
      [p.userId, p.idempotencyKey]);
    if (prior.length) {
      if (prior[0].request_hash !== hash) throw appError(409, "Idempotency-Key used with a different request");
      if (!prior[0].booking_id) throw appError(409, "Request is still processing; retry shortly");
      const [old] = await c.query(
        "SELECT id, booking_reference, status, payment_status, currency_code, subtotal_amount, total_amount, expires_at, created_at FROM bookings WHERE id=? AND user_id=? LIMIT 1",
        [prior[0].booking_id, p.userId]);
      if (!old.length) throw appError(409, "Original booking is unavailable");
      await c.commit();
      return { replayed: true, booking: old[0] };
    }
    await c.query("INSERT INTO booking_idempotency_keys (user_id,idempotency_key,request_hash) VALUES (?,?,?)",
      [p.userId, p.idempotencyKey, hash]);
    const [departures] = await c.query(
      `SELECT d.id,d.tour_id,d.starts_at,d.seat_capacity,d.seats_reserved,d.price_override,
              d.status AS departure_status,t.base_price,t.currency_code,t.status AS tour_status,t.deleted_at
         FROM tour_departures d JOIN tours t ON t.id=d.tour_id WHERE d.id=? LIMIT 1 FOR UPDATE`,
      [p.departureId]);
    if (!departures.length) throw appError(404, "Departure not found");
    const d = departures[0];
    if (d.tour_status !== "published" || d.deleted_at) throw appError(409, "Tour is unavailable");
    if (d.departure_status !== "scheduled") throw appError(409, "Departure is not open for booking");
    if (new Date(d.starts_at).getTime() <= Date.now()) throw appError(409, "Departure has already started");
    await c.query("UPDATE seat_holds SET status='expired' WHERE departure_id=? AND status='active' AND expires_at<=UTC_TIMESTAMP()", [p.departureId]);
    const [holds] = await c.query(
      "SELECT COALESCE(SUM(quantity),0) AS held FROM seat_holds WHERE departure_id=? AND status='active' AND expires_at>UTC_TIMESTAMP()",
      [p.departureId]);
    const available = Number(d.seat_capacity) - Number(d.seats_reserved) - Number(holds[0].held || 0);
    if (available < p.quantity) throw appError(409, "Not enough seats available");
    const unit = Number(d.price_override === null ? d.base_price : d.price_override);
    if (!Number.isFinite(unit) || unit < 0) throw appError(500, "Invalid departure price");
    const total = Math.round(unit * 100 * p.quantity) / 100;
    const minutes = holdMinutes();
    const currency = d.currency_code || "BDT";
    const [b] = await c.query(
      `INSERT INTO bookings (user_id,booking_reference,status,payment_status,currency_code,subtotal_amount,total_amount,expires_at,created_at,updated_at)
       VALUES (?,?,'pending','unpaid',?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE),UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
      [p.userId, bookingRef(), currency, total, total, minutes]);
    const bookingId = b.insertId;
    await c.query("INSERT INTO booking_items (booking_id,tour_id,departure_id,quantity,unit_price,line_total) VALUES (?,?,?,?,?,?)",
      [bookingId, d.tour_id, p.departureId, p.quantity, unit, total]);
    for (const t of p.travelers) {
      await c.query("INSERT INTO booking_travelers (booking_id,full_name,email,phone) VALUES (?,?,?,?)",
        [bookingId, t.full_name, t.email, t.phone]);
    }
    const token = crypto.randomBytes(24).toString("hex");
    await c.query(
      `INSERT INTO seat_holds (hold_token,booking_id,departure_id,quantity,expires_at,status,created_at)
       VALUES (?,?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE),'active',UTC_TIMESTAMP())`,
      [token, bookingId, p.departureId, p.quantity, minutes]);
    await c.query("UPDATE booking_idempotency_keys SET booking_id=? WHERE user_id=? AND idempotency_key=?",
      [bookingId, p.userId, p.idempotencyKey]);
    const [created] = await c.query(
      "SELECT id,booking_reference,status,payment_status,currency_code,subtotal_amount,total_amount,expires_at,created_at FROM bookings WHERE id=?",
      [bookingId]);
    await c.commit();
    return { replayed: false, booking: created[0], hold: { token, expires_at: created[0].expires_at } };
  } catch (e) {
    try { await c.rollback(); } catch (_) {}
    if (e && e.code === "ER_DUP_ENTRY") throw appError(409, "Idempotency-Key conflict; retry using the same key");
    throw e;
  } finally { c.release(); }
}
async function expireHoldsBatch(batchSize=500) {
  const c = await db.pool.getConnection();
  try {
    await c.beginTransaction();
    const [rows] = await c.query(
      "SELECT id,booking_id FROM seat_holds WHERE status='active' AND expires_at<=UTC_TIMESTAMP() ORDER BY expires_at,id LIMIT ? FOR UPDATE",
      [Math.min(2000, Math.max(1, Number(batchSize)||500))]);
    if (!rows.length) { await c.commit(); return { holds_expired: 0, bookings_expired: 0 }; }
    const ids = rows.map(r=>r.id), bookings = [...new Set(rows.map(r=>r.booking_id).filter(Boolean))];
    await c.query(`UPDATE seat_holds SET status='expired' WHERE status='active' AND id IN (${ids.map(()=>"?").join(",")})`, ids);
    let bookingsExpired = 0;
    if (bookings.length) {
      const [r] = await c.query(
        `UPDATE bookings SET status='expired',updated_at=UTC_TIMESTAMP()
          WHERE id IN (${bookings.map(()=>"?").join(",")}) AND status='pending' AND expires_at<=UTC_TIMESTAMP()`, bookings);
      bookingsExpired = r.affectedRows || 0;
    }
    await c.commit();
    return { holds_expired: ids.length, bookings_expired: bookingsExpired };
  } catch (e) { try { await c.rollback(); } catch (_) {} throw e; }
  finally { c.release(); }
}
module.exports = { createBooking, expireHoldsBatch };
