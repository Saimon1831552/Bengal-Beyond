const crypto = require("crypto");
const db = require("../../config/db");

function holdMinutes() {
  const n = Number.parseInt(process.env.BOOKING_HOLD_MINUTES, 10);
  return Number.isInteger(n) ? Math.min(60, Math.max(5, n)) : 15;
}

function appError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function bookingRef() {
  return `BB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function payloadHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify({
    departure_id: payload.departureId,
    quantity: payload.quantity,
    customer_name: payload.customerName,
    customer_email: payload.customerEmail,
    customer_phone: payload.customerPhone,
    customer_nationality: payload.customerNationality || null,
    travelers: payload.travelers
  })).digest("hex");
}

const BOOKING_FIELDS = `id, booking_reference, booking_status, payment_status,
  customer_name, customer_email, customer_phone, customer_nationality,
  currency_code, subtotal, total_amount, expires_at, created_at`;

async function createBooking(payload) {
  const hash = payloadHash(payload);
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    const [prior] = await connection.query(
      `SELECT request_hash, booking_id FROM booking_idempotency_keys
        WHERE user_id = ? AND idempotency_key = ? LIMIT 1 FOR UPDATE`,
      [payload.userId, payload.idempotencyKey]
    );
    if (prior.length) {
      if (prior[0].request_hash !== hash) {
        throw appError(409, "Idempotency-Key used with a different request");
      }
      if (!prior[0].booking_id) {
        throw appError(409, "Request is still processing; retry shortly");
      }

      const [old] = await connection.query(
        `SELECT ${BOOKING_FIELDS} FROM bookings
          WHERE id = ? AND user_id = ? LIMIT 1`,
        [prior[0].booking_id, payload.userId]
      );
      if (!old.length) throw appError(409, "Original booking is unavailable");
      await connection.commit();
      return { replayed: true, booking: old[0] };
    }

    await connection.query(
      `INSERT INTO booking_idempotency_keys (user_id, idempotency_key, request_hash)
       VALUES (?, ?, ?)`,
      [payload.userId, payload.idempotencyKey, hash]
    );

    const [departures] = await connection.query(
      `SELECT d.id, d.tour_id, d.starts_at, d.seat_capacity, d.seats_reserved,
              d.price_override, d.status AS departure_status,
              t.title, t.destination, t.duration_days, t.base_price,
              t.currency_code, t.status AS tour_status, t.deleted_at
         FROM tour_departures d
         JOIN tours t ON t.id = d.tour_id
        WHERE d.id = ? LIMIT 1 FOR UPDATE`,
      [payload.departureId]
    );
    if (!departures.length) throw appError(404, "Departure not found");
    const departure = departures[0];
    if (departure.tour_status !== "published" || departure.deleted_at) {
      throw appError(409, "Tour is unavailable");
    }
    if (departure.departure_status !== "scheduled") {
      throw appError(409, "Departure is not open for booking");
    }
    if (new Date(departure.starts_at).getTime() <= Date.now()) {
      throw appError(409, "Departure has already started");
    }

    await connection.query(
      `UPDATE seat_holds SET hold_status = 'expired'
        WHERE departure_id = ? AND hold_status = 'active'
          AND expires_at <= UTC_TIMESTAMP()`,
      [payload.departureId]
    );
    const [holds] = await connection.query(
      `SELECT COALESCE(SUM(quantity), 0) AS held FROM seat_holds
        WHERE departure_id = ? AND hold_status = 'active'
          AND expires_at > UTC_TIMESTAMP()`,
      [payload.departureId]
    );
    const available = Number(departure.seat_capacity)
      - Number(departure.seats_reserved)
      - Number(holds[0].held || 0);
    if (available < payload.quantity) throw appError(409, "Not enough seats available");

    const unitPrice = Number(
      departure.price_override === null ? departure.base_price : departure.price_override
    );
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw appError(500, "Invalid departure price");
    }
    const subtotal = Math.round(unitPrice * 100 * payload.quantity) / 100;
    const minutes = holdMinutes();
    const currency = departure.currency_code || "BDT";

    const [bookingResult] = await connection.query(
      `INSERT INTO bookings
        (user_id, booking_reference, booking_status, payment_status,
         customer_name, customer_email, customer_phone, customer_nationality,
         currency_code, subtotal, total_amount, expires_at, created_at, updated_at)
       VALUES (?, ?, 'pending_review', 'unpaid', ?, ?, ?, ?, ?, ?, ?,
         DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [
        payload.userId,
        bookingRef(),
        payload.customerName,
        payload.customerEmail,
        payload.customerPhone,
        payload.customerNationality || null,
        currency,
        subtotal,
        subtotal,
        minutes
      ]
    );
    const bookingId = bookingResult.insertId;
    const tourSnapshot = JSON.stringify({
      title: departure.title,
      destination: departure.destination,
      duration_days: departure.duration_days,
      currency_code: currency
    });

    await connection.query(
      `INSERT INTO booking_items
        (booking_id, tour_id, departure_id, quantity, unit_price, line_total, tour_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, departure.tour_id, payload.departureId, payload.quantity, unitPrice, subtotal, tourSnapshot]
    );

    for (const traveler of payload.travelers) {
      await connection.query(
        `INSERT INTO booking_travelers
          (booking_id, traveler_name, traveler_type, nationality)
         VALUES (?, ?, ?, ?)`,
        [bookingId, traveler.traveler_name, traveler.traveler_type, traveler.nationality]
      );
    }

    const [holdResult] = await connection.query(
      `INSERT INTO seat_holds (booking_id, departure_id, quantity, expires_at, hold_status, created_at)
       VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), 'active', UTC_TIMESTAMP())`,
      [bookingId, payload.departureId, payload.quantity, minutes]
    );
    await connection.query(
      `INSERT INTO booking_status_history
        (booking_id, previous_status, new_status, changed_by_user_id, note)
       VALUES (?, NULL, 'pending_review', ?, 'Booking created')`,
      [bookingId, payload.userId]
    );
    await connection.query(
      `UPDATE booking_idempotency_keys SET booking_id = ?
        WHERE user_id = ? AND idempotency_key = ?`,
      [bookingId, payload.userId, payload.idempotencyKey]
    );

    const [created] = await connection.query(
      `SELECT ${BOOKING_FIELDS} FROM bookings WHERE id = ?`,
      [bookingId]
    );
    await connection.commit();

    return {
      replayed: false,
      booking: created[0],
      hold: { id: holdResult.insertId, expires_at: created[0].expires_at }
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {
      // Preserve the original transaction error.
    }
    if (error && error.code === "ER_DUP_ENTRY") {
      throw appError(409, "Idempotency-Key conflict; retry using the same key");
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function expireHoldsBatch(batchSize = 500) {
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT h.id, h.booking_id
         FROM seat_holds h JOIN bookings b ON b.id = h.booking_id
        WHERE h.hold_status = 'active' AND h.expires_at <= UTC_TIMESTAMP()
          AND b.payment_status <> 'paid'
          AND (b.payment_status <> 'pending' OR b.updated_at < UTC_TIMESTAMP() - INTERVAL 45 MINUTE)
        ORDER BY h.expires_at, h.id LIMIT ? FOR UPDATE`,
      [Math.min(2000, Math.max(1, Number(batchSize) || 500))]
    );
    if (!rows.length) {
      await connection.commit();
      return { holds_expired: 0, bookings_expired: 0 };
    }

    const ids = rows.map((row) => row.id);
    const bookingIds = [...new Set(rows.map((row) => row.booking_id).filter(Boolean))];
    await connection.query(
      `UPDATE seat_holds SET hold_status = 'expired'
        WHERE hold_status = 'active' AND id IN (${ids.map(() => "?").join(",")})`,
      ids
    );

    let bookingsExpired = 0;
    if (bookingIds.length) {
      const [result] = await connection.query(
        `UPDATE bookings SET booking_status = 'expired', updated_at = UTC_TIMESTAMP()
          WHERE id IN (${bookingIds.map(() => "?").join(",")})
            AND booking_status IN ('pending_review', 'awaiting_payment')
            AND expires_at <= UTC_TIMESTAMP()`,
        bookingIds
      );
      bookingsExpired = result.affectedRows || 0;
    }

    await connection.commit();
    return { holds_expired: ids.length, bookings_expired: bookingsExpired };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {
      // Preserve the original transaction error.
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createBooking, expireHoldsBatch };
