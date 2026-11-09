const { pool, withTransaction } = require("../../config/db");

function problem(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function listPayments(userId, page, limit) {
  const offset = (page - 1) * limit;
  const [[count]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE b.user_id = ?",
    [userId]
  );
  const [items] = await pool.execute(
    `SELECT p.id, p.booking_id, b.booking_reference, p.provider,
            p.provider_payment_id, p.amount, p.currency_code, p.status,
            p.verified_at, p.created_at, p.updated_at
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
      WHERE b.user_id = ?
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const total = Number(count.total);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getPayment(userId, paymentId) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.booking_id, b.booking_reference, p.provider,
            p.provider_payment_id, p.amount, p.currency_code, p.status,
            p.verified_at, p.created_at, p.updated_at
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
      WHERE p.id = ? AND b.user_id = ?`,
    [paymentId, userId]
  );
  if (!rows.length) throw problem(404, "Payment not found.");
  return rows[0];
}

async function initiatePayment(userId, bookingId, body) {
  const key = typeof body.idempotency_key === "string" ? body.idempotency_key.trim() : "";
  if (!key || key.length > 100) {
    throw problem(400, "idempotency_key is required and must be at most 100 characters.");
  }

  return withTransaction(async (conn) => {
    const [bookings] = await conn.execute(
      "SELECT * FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE",
      [bookingId, userId]
    );
    if (!bookings.length) throw problem(404, "Booking not found.");
    const booking = bookings[0];

    // payments.idempotency_key is globally UNIQUE in the supplied SQL schema.
    const [sameKey] = await conn.execute(
      `SELECT p.id, p.booking_id, p.provider, p.amount, p.currency_code, p.status
         FROM payments p
        WHERE p.idempotency_key = ?
        LIMIT 1`,
      [key]
    );
    if (sameKey.length) {
      if (Number(sameKey[0].booking_id) !== Number(bookingId)) {
        throw problem(409, "This idempotency key has already been used for another booking.");
      }
      return { ...sameKey[0], reused: true };
    }

    if (!["pending_review", "awaiting_payment"].includes(booking.booking_status)) {
      throw problem(409, "This booking is not eligible for payment.");
    }
    if (["paid", "not_required", "partially_refunded", "refunded"].includes(booking.payment_status)) {
      throw problem(409, "This booking does not currently require another payment.");
    }
    if (!(Number(booking.total_amount) > 0)) {
      throw problem(409, "Booking total must be greater than zero.");
    }

    const [openAttempts] = await conn.execute(
      `SELECT id, booking_id, provider, amount, currency_code, status
         FROM payments
        WHERE booking_id = ? AND status IN ('initiated', 'pending')
        ORDER BY id DESC LIMIT 1`,
      [bookingId]
    );
    if (openAttempts.length) {
      throw problem(409, "A payment attempt is already initiated or pending for this booking. Retry using its original idempotency key.");
    }

    const [insert] = await conn.execute(
      `INSERT INTO payments
        (booking_id, provider, provider_payment_id, idempotency_key, amount, currency_code, status)
       VALUES (?, 'manual_pending', NULL, ?, ?, ?, 'initiated')`,
      [bookingId, key, booking.total_amount, booking.currency_code]
    );
    await conn.execute(
      "UPDATE bookings SET payment_status = 'pending' WHERE id = ?",
      [bookingId]
    );

    return {
      id: insert.insertId,
      booking_id: bookingId,
      provider: "manual_pending",
      amount: booking.total_amount,
      currency_code: booking.currency_code,
      status: "initiated",
      reused: false,
      message: "Payment attempt recorded. No external checkout session has been created.",
    };
  });
}

module.exports = { listPayments, getPayment, initiatePayment };
