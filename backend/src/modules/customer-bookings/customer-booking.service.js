const { pool, withTransaction } = require("../../config/db");

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const EDITABLE_STATUSES = ["pending_review", "awaiting_payment"];
const TRAVELER_TYPES = new Set(["adult", "child", "infant"]);

async function listBookings(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const [[countRow]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM bookings WHERE user_id = ?",
    [userId]
  );
  const [rows] = await pool.execute(
    `SELECT b.id, b.booking_reference, b.booking_status, b.payment_status,
            b.currency_code, b.total_amount, b.created_at,
            COUNT(DISTINCT bi.id) AS item_count,
            COALESCE(SUM(bi.quantity), 0) AS traveler_count
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return {
    items: rows,
    pagination: {
      page, limit, total: Number(countRow.total),
      totalPages: Math.ceil(Number(countRow.total) / limit),
    },
  };
}

async function ownedBooking(connection, userId, bookingId, lock = false) {
  const [rows] = await connection.execute(
    `SELECT b.* FROM bookings b WHERE b.id = ? AND b.user_id = ? ${lock ? "FOR UPDATE" : ""}`,
    [bookingId, userId]
  );
  if (!rows.length) throw httpError(404, "Booking not found.");
  return rows[0];
}

async function getBooking(userId, bookingId) {
  const booking = await ownedBooking(pool, userId, bookingId);
  const [items] = await pool.execute(
    `SELECT bi.id, bi.tour_id, bi.departure_id, bi.quantity, bi.unit_price,
            bi.line_total, bi.tour_snapshot, td.starts_at, td.ends_at,
            td.status AS departure_status
       FROM booking_items bi
       LEFT JOIN tour_departures td ON td.id = bi.departure_id
      WHERE bi.booking_id = ? ORDER BY bi.id`,
    [bookingId]
  );
  const [travelers] = await pool.execute(
    `SELECT id, traveler_name, traveler_type, nationality, created_at
       FROM booking_travelers WHERE booking_id = ? ORDER BY id`,
    [bookingId]
  );
  const [holds] = await pool.execute(
    `SELECT id, departure_id, quantity, expires_at, hold_status
       FROM seat_holds WHERE booking_id = ? AND hold_status = 'active'
      ORDER BY id`,
    [bookingId]
  );
  return { booking, items, travelers, active_seat_holds: holds };
}

async function replaceTravelers(userId, bookingId, body) {
  if (!Array.isArray(body.travelers) || body.travelers.length < 1 || body.travelers.length > 100) {
    throw httpError(400, "travelers must be an array containing 1 to 100 traveler records.");
  }
  const travelers = body.travelers.map((t) => {
    if (!t || typeof t.traveler_name !== "string" || !t.traveler_name.trim() || t.traveler_name.trim().length > 160) {
      throw httpError(400, "Each traveler requires traveler_name (1–160 characters).");
    }
    const type = t.traveler_type || "adult";
    if (!TRAVELER_TYPES.has(type)) throw httpError(400, "traveler_type must be adult, child, or infant.");
    const nationality = t.nationality == null || t.nationality === "" ? null : String(t.nationality).trim();
    if (nationality && nationality.length > 100) throw httpError(400, "nationality must be 100 characters or fewer.");
    return { traveler_name: t.traveler_name.trim(), traveler_type: type, nationality };
  });

  return withTransaction(async (conn) => {
    const booking = await ownedBooking(conn, userId, bookingId, true);
    if (!EDITABLE_STATUSES.includes(booking.booking_status)) {
      throw httpError(409, "Traveler details can only be changed while the booking is pending review or awaiting payment.");
    }
    const [[count]] = await conn.execute(
      "SELECT COALESCE(SUM(quantity), 0) AS quantity FROM booking_items WHERE booking_id = ?",
      [bookingId]
    );
    if (Number(count.quantity) !== travelers.length) {
      throw httpError(400, `Provide exactly ${Number(count.quantity)} traveler records to match the booking quantity.`);
    }
    await conn.execute("DELETE FROM booking_travelers WHERE booking_id = ?", [bookingId]);
    for (const traveler of travelers) {
      await conn.execute(
        `INSERT INTO booking_travelers (booking_id, traveler_name, traveler_type, nationality)
         VALUES (?, ?, ?, ?)`,
        [bookingId, traveler.traveler_name, traveler.traveler_type, traveler.nationality]
      );
    }
    const [saved] = await conn.execute(
      `SELECT id, traveler_name, traveler_type, nationality, created_at
         FROM booking_travelers WHERE booking_id = ? ORDER BY id`,
      [bookingId]
    );
    return { booking_id: bookingId, travelers: saved };
  });
}

async function updateSpecialRequests(userId, bookingId, body) {
  if (typeof body.special_requests !== "string" && body.special_requests !== null) {
    throw httpError(400, "special_requests must be a string or null.");
  }
  const value = body.special_requests == null ? null : body.special_requests.trim();
  if (value && value.length > 5000) throw httpError(400, "special_requests must be 5000 characters or fewer.");
  return withTransaction(async (conn) => {
    const booking = await ownedBooking(conn, userId, bookingId, true);
    if (!EDITABLE_STATUSES.includes(booking.booking_status)) {
      throw httpError(409, "Special requests can only be changed while the booking is pending review or awaiting payment.");
    }
    await conn.execute("UPDATE bookings SET special_requests = ? WHERE id = ?", [value || null, bookingId]);
    return { booking_id: bookingId, special_requests: value || null };
  });
}

async function requestCancellation(userId, bookingId, body) {
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length > 2000) throw httpError(400, "reason is required and must be 2000 characters or fewer.");
  return withTransaction(async (conn) => {
    const booking = await ownedBooking(conn, userId, bookingId, true);
    if (["cancelled", "rejected", "expired", "completed"].includes(booking.booking_status)) {
      throw httpError(409, "A cancellation request cannot be submitted for this booking status.");
    }
    const [existing] = await conn.execute(
      `SELECT id FROM booking_change_requests
        WHERE booking_id = ? AND requested_by = ? AND request_type = 'other' AND status = 'pending'
        ORDER BY id DESC LIMIT 1`,
      [bookingId, userId]
    );
    if (existing.length) throw httpError(409, "A pending request already exists for this booking.");
    const details = JSON.stringify({ category: "cancellation_request", reason });
    const [result] = await conn.execute(
      `INSERT INTO booking_change_requests
        (booking_id, requested_by, request_type, request_details, status)
       VALUES (?, ?, 'other', ?, 'pending')`,
      [bookingId, userId, details]
    );
    return { request_id: result.insertId, booking_id: bookingId, status: "pending" };
  });
}

module.exports = {
  listBookings, getBooking, replaceTravelers, updateSpecialRequests, requestCancellation,
};
