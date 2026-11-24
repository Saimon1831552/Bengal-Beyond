const crypto = require("crypto");
const db = require("../../config/db");
const { queueBookingEmail } = require("../notifications/booking-events");

function holdMinutes() {
  const n = Number.parseInt(process.env.BOOKING_HOLD_MINUTES, 10);
  return Number.isInteger(n) ? Math.min(60, Math.max(5, n)) : 15;
}

function guestHoldMinutes() {
  const n = Number.parseInt(process.env.GUEST_BOOKING_HOLD_MINUTES, 10);
  return Number.isInteger(n) ? Math.min(10080, Math.max(60, n)) : 1440; // default 24h
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
  const hashPayload = {
    departure_id: payload.departureId,
    quantity: payload.quantity,
    customer_name: payload.customerName,
    customer_email: payload.customerEmail,
    customer_phone: payload.customerPhone,
    customer_nationality: payload.customerNationality || null,
    travelers: payload.travelers
  };
  if (payload.addonIds?.length) hashPayload.addon_ids = payload.addonIds;
  return crypto.createHash("sha256").update(JSON.stringify(hashPayload)).digest("hex");
}

async function memberDiscountPercent(conn) {
  const [rows] = await conn.query(
    "SELECT setting_value FROM admin_settings WHERE setting_key = 'member_discount_percent' LIMIT 1"
  );
  if (!rows.length) return 5;
  try {
    const v = JSON.parse(rows[0].setting_value);
    return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 5;
  } catch {
    return 5;
  }
}

const BOOKING_FIELDS = `id, booking_reference, booking_status, payment_status,
  customer_name, customer_email, customer_phone, customer_nationality,
  currency_code, subtotal, discount_amount, member_discount_amount,
  total_amount, expires_at, created_at`;

async function createBooking(payload) {
  const hash = payloadHash(payload);
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    const guest = !payload.userId;
    const ownerSql = guest ? "user_id IS NULL" : "user_id = ?";
    const ownerParams = guest ? [] : [payload.userId];

    const [prior] = await connection.query(
      `SELECT request_hash, booking_id FROM booking_idempotency_keys
        WHERE ${ownerSql} AND idempotency_key = ? LIMIT 1 FOR UPDATE`,
      [...ownerParams, payload.idempotencyKey]
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
          WHERE id = ? AND ${ownerSql} LIMIT 1`,
        [prior[0].booking_id, ...ownerParams]
      );
      if (!old.length) throw appError(409, "Original booking is unavailable");
      await connection.commit();
      return { replayed: true, booking: old[0] };
    }

    await connection.query(
      `INSERT INTO booking_idempotency_keys (user_id, idempotency_key, request_hash)
       VALUES (?, ?, ?)`,
      [payload.userId || null, payload.idempotencyKey, hash]
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

    // Synchronized expiry of stale seat holds and their corresponding unpaid bookings
    const [staleHolds] = await connection.query(
      `SELECT h.id, h.booking_id, b.booking_status
         FROM seat_holds h
         JOIN bookings b ON b.id = h.booking_id
        WHERE h.departure_id = ?
          AND h.hold_status = 'active'
          AND h.expires_at <= UTC_TIMESTAMP()
          AND b.payment_status <> 'paid'
          AND (b.payment_status <> 'pending' OR b.updated_at < UTC_TIMESTAMP() - INTERVAL 45 MINUTE)
        FOR UPDATE`,
      [payload.departureId]
    );

    if (staleHolds.length) {
      const staleHoldIds = staleHolds.map((h) => h.id);
      await connection.query(
        `UPDATE seat_holds SET hold_status = 'expired'
          WHERE hold_status = 'active' AND id IN (${staleHoldIds.map(() => "?").join(",")})`,
        staleHoldIds
      );

      const expirableBookings = staleHolds.filter(
        (h, idx, arr) =>
          h.booking_id &&
          ["pending_review", "awaiting_payment"].includes(h.booking_status) &&
          arr.findIndex((item) => item.booking_id === h.booking_id) === idx
      );

      if (expirableBookings.length) {
        const staleBookingIds = expirableBookings.map((b) => b.booking_id);
        const [expireResult] = await connection.query(
          `UPDATE bookings SET booking_status = 'expired', updated_at = UTC_TIMESTAMP()
            WHERE id IN (${staleBookingIds.map(() => "?").join(",")})
              AND booking_status IN ('pending_review', 'awaiting_payment')
              AND expires_at <= UTC_TIMESTAMP()`,
          staleBookingIds
        );

        if (expireResult.affectedRows > 0) {
          for (const b of expirableBookings) {
            await connection.query(
              `INSERT INTO booking_status_history
                (booking_id, previous_status, new_status, changed_by_user_id, note)
               VALUES (?, ?, 'expired', NULL, 'Seat hold expired')`,
              [b.booking_id, b.booking_status]
            );
          }
        }
      }
    }

    const [holds] = await connection.query(
      `SELECT COALESCE(SUM(quantity), 0) AS held FROM seat_holds
        WHERE departure_id = ? AND hold_status = 'active'
          AND expires_at > UTC_TIMESTAMP()`,
      [payload.departureId]
    );
    const available =
      Number(departure.seat_capacity) -
      Number(departure.seats_reserved) -
      Number(holds[0].held || 0);
    if (available < payload.quantity) throw appError(409, "Not enough seats available");

    const unitPrice = Number(
      departure.price_override === null ? departure.base_price : departure.price_override
    );
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw appError(500, "Invalid departure price");
    }
    const tourSubtotalCents = Math.round(unitPrice * 100 * payload.quantity);
    const addonIds = payload.addonIds || [];
    let addonsTotalCents = 0;
    let selectedAddons = [];
    if (addonIds.length) {
      const placeholders = addonIds.map(() => "?").join(",");
      const [addonRows] = await connection.query(
        `SELECT id, name, description, price, pricing_mode
           FROM tour_addons
          WHERE tour_id = ? AND is_active = 1 AND id IN (${placeholders})
          ORDER BY id FOR UPDATE`,
        [departure.tour_id, ...addonIds]
      );
      if (addonRows.length !== addonIds.length) {
        throw appError(400, "One or more selected add-ons are unavailable for this tour");
      }
      selectedAddons = addonRows.map((addon) => {
        const priceCents = Math.round(Number(addon.price) * 100);
        if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
          throw appError(500, "Invalid tour add-on price");
        }
        const quantity = addon.pricing_mode === "per_person" ? payload.quantity : 1;
        const lineTotalCents = priceCents * quantity;
        addonsTotalCents += lineTotalCents;
        return { ...addon, quantity, priceCents, lineTotalCents };
      });
    }
    const subtotalCents = tourSubtotalCents + addonsTotalCents;
    const pct = payload.userId ? await memberDiscountPercent(connection) : 0; // members only
    const discountCents = Math.round((subtotalCents * pct) / 100);
    const subtotal = subtotalCents / 100;
    const discount = discountCents / 100;
    const total = (subtotalCents - discountCents) / 100;
    const minutes = payload.userId ? holdMinutes() : guestHoldMinutes();
    const currency = departure.currency_code || "BDT";

    const [bookingResult] = await connection.query(
      `INSERT INTO bookings
        (user_id, booking_reference, booking_status, payment_status,
         customer_name, customer_email, customer_phone, customer_nationality,
         currency_code, subtotal, discount_amount, member_discount_amount, total_amount,
         expires_at, created_at, updated_at)
       VALUES (?, ?, 'pending_review', 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?,
         DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [
        payload.userId || null,
        bookingRef(),
        payload.customerName,
        payload.customerEmail,
        payload.customerPhone,
        payload.customerNationality || null,
        currency,
        subtotal,
        discount,
        discount,
        total,
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

    const [itemResult] = await connection.query(
      `INSERT INTO booking_items
        (booking_id, tour_id, departure_id, quantity, unit_price, line_total, tour_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        departure.tour_id,
        payload.departureId,
        payload.quantity,
        unitPrice,
        tourSubtotalCents / 100,
        tourSnapshot
      ]
    );
    for (const addon of selectedAddons) {
      await connection.query(
        `INSERT INTO booking_addons
          (booking_item_id, addon_id, quantity, unit_price, line_total, addon_snapshot)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemResult.insertId,
          addon.id,
          addon.quantity,
          addon.priceCents / 100,
          addon.lineTotalCents / 100,
          JSON.stringify({
            name: addon.name,
            description: addon.description,
            pricing_mode: addon.pricing_mode,
            price: addon.priceCents / 100,
          }),
        ]
      );
    }

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
    await queueBookingEmail(connection, bookingId, "booking_received", { hold_minutes: String(minutes) });
    await connection.query(
      `UPDATE booking_idempotency_keys SET booking_id = ?
        WHERE ${ownerSql} AND idempotency_key = ?`,
      [bookingId, ...ownerParams, payload.idempotencyKey]
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
      `SELECT h.id, h.booking_id, b.booking_status
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
    await connection.query(
      `UPDATE seat_holds SET hold_status = 'expired'
        WHERE hold_status = 'active' AND id IN (${ids.map(() => "?").join(",")})`,
      ids
    );

    const expirableBookings = rows.filter(
      (r, idx, arr) =>
        r.booking_id &&
        ["pending_review", "awaiting_payment"].includes(r.booking_status) &&
        arr.findIndex((item) => item.booking_id === r.booking_id) === idx
    );

    let bookingsExpired = 0;
    if (expirableBookings.length) {
      const bookingIds = expirableBookings.map((b) => b.booking_id);
      const [result] = await connection.query(
        `UPDATE bookings SET booking_status = 'expired', updated_at = UTC_TIMESTAMP()
          WHERE id IN (${bookingIds.map(() => "?").join(",")})
            AND booking_status IN ('pending_review', 'awaiting_payment')
            AND expires_at <= UTC_TIMESTAMP()`,
        bookingIds
      );
      bookingsExpired = result.affectedRows || 0;

      if (bookingsExpired > 0) {
        for (const b of expirableBookings) {
          await connection.query(
            `INSERT INTO booking_status_history
              (booking_id, previous_status, new_status, changed_by_user_id, note)
             VALUES (?, ?, 'expired', NULL, 'Seat hold expired')`,
            [b.booking_id, b.booking_status]
          );
        }
      }
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