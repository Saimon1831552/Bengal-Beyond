const { pool, withTransaction } = require("../../config/db");

function fail(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

// Convert MariaDB DECIMAL strings to integer cents; avoid floating point totals.
function cents(value) {
  const text = String(value ?? "0");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) fail("Invalid monetary value in booking data", 500);
  const negative = text.startsWith("-");
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction = ""] = unsigned.split(".");
  const result = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  return negative ? -result : result;
}
function money(value) {
  return (value / 100).toFixed(2);
}
function computeDiscount(coupon, subtotalCents) {
  const valueCents = cents(coupon.discount_value);
  let discount;
  if (coupon.discount_type === "percentage") {
    // discount_value is DECIMAL(12,2), e.g. 10.00 means 10 percent.
    discount = Math.round((subtotalCents * valueCents) / 10000);
  } else {
    discount = valueCents;
  }
  if (coupon.max_discount_amount !== null) {
    discount = Math.min(discount, cents(coupon.max_discount_amount));
  }
  return Math.max(0, Math.min(discount, subtotalCents));
}
async function loadOwnedBooking(conn, bookingId, userId) {
  const [[booking]] = await conn.execute(
    `SELECT id, user_id, booking_status, payment_status, currency_code,
            subtotal, discount_amount, tax_amount, total_amount
       FROM bookings WHERE id = ? FOR UPDATE`, [bookingId]);
  if (!booking) fail("Booking not found", 404);
  if (String(booking.user_id) !== String(userId)) fail("Booking does not belong to the authenticated customer", 403);
  if (!["pending_review", "awaiting_payment"].includes(booking.booking_status)) {
    fail("Pricing can only be changed while the booking is awaiting review or payment", 409);
  }
  if (["paid", "partially_refunded", "refunded"].includes(booking.payment_status)) {
    fail("Pricing cannot be changed after payment", 409);
  }
  return booking;
}
async function checkCoupon(conn, coupon, booking, userId, bookingId) {
  if (!coupon || coupon.status !== "active") fail("Coupon is invalid or inactive", 404);
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) fail("Coupon is not active yet", 409);
  if (coupon.ends_at && new Date(coupon.ends_at) < now) fail("Coupon has expired", 409);
  const subtotal = cents(booking.subtotal);
  if (subtotal < cents(coupon.min_order_amount)) fail("Booking subtotal does not meet the coupon minimum", 409);

  const [[usage]] = await conn.execute(
    `SELECT COUNT(*) AS total FROM coupon_redemptions
      WHERE coupon_id = ? AND status IN ('reserved','redeemed') AND booking_id <> ?`,
    [coupon.id, bookingId]);
  if (coupon.usage_limit !== null && Number(usage.total) >= Number(coupon.usage_limit)) {
    fail("Coupon usage limit has been reached", 409);
  }
  const [[userUsage]] = await conn.execute(
    `SELECT COUNT(*) AS total FROM coupon_redemptions
      WHERE coupon_id = ? AND user_id = ? AND status IN ('reserved','redeemed') AND booking_id <> ?`,
    [coupon.id, userId, bookingId]);
  if (coupon.per_user_limit !== null && Number(userUsage.total) >= Number(coupon.per_user_limit)) {
    fail("Your coupon usage limit has been reached", 409);
  }
}
function totals(booking, discountCents) {
  const subtotal = cents(booking.subtotal);
  const tax = cents(booking.tax_amount);
  return {
    discountAmount: money(discountCents),
    totalAmount: money(Math.max(0, subtotal - discountCents + tax))
  };
}

async function applyCoupon({ bookingId, userId, code }) {
  return withTransaction(async (conn) => {
    const booking = await loadOwnedBooking(conn, bookingId, userId);
    // Lock the coupon row to serialize competing reservations against its usage limits.
    const [[coupon]] = await conn.execute("SELECT * FROM coupons WHERE code = ? FOR UPDATE", [code]);
    await checkCoupon(conn, coupon, booking, userId, bookingId);
    const discountCents = computeDiscount(coupon, cents(booking.subtotal));
    if (discountCents <= 0) fail("Coupon does not produce a discount for this booking", 409);
    const amounts = totals(booking, discountCents);

    const [[existing]] = await conn.execute(
      "SELECT id, coupon_id, status FROM coupon_redemptions WHERE booking_id = ? FOR UPDATE",
      [bookingId]);
    if (existing && existing.status === "redeemed") fail("A redeemed coupon cannot be changed", 409);
    if (existing) {
      await conn.execute(
        `UPDATE coupon_redemptions
            SET coupon_id = ?, user_id = ?, discount_amount = ?, status = 'reserved'
          WHERE id = ?`,
        [coupon.id, userId, amounts.discountAmount, existing.id]);
    } else {
      await conn.execute(
        `INSERT INTO coupon_redemptions
          (coupon_id, booking_id, user_id, discount_amount, status)
         VALUES (?, ?, ?, ?, 'reserved')`,
        [coupon.id, bookingId, userId, amounts.discountAmount]);
    }
    await conn.execute(
      `UPDATE bookings SET discount_amount = ?, total_amount = ? WHERE id = ?`,
      [amounts.discountAmount, amounts.totalAmount, bookingId]);

    return {
      bookingId: Number(bookingId),
      coupon: { id: Number(coupon.id), code: coupon.code, discountType: coupon.discount_type },
      currencyCode: booking.currency_code,
      subtotal: money(cents(booking.subtotal)),
      discountAmount: amounts.discountAmount,
      taxAmount: money(cents(booking.tax_amount)),
      totalAmount: amounts.totalAmount,
      redemptionStatus: "reserved"
    };
  });
}

async function removeCoupon({ bookingId, userId }) {
  return withTransaction(async (conn) => {
    const booking = await loadOwnedBooking(conn, bookingId, userId);
    const [[redemption]] = await conn.execute(
      "SELECT id, status FROM coupon_redemptions WHERE booking_id = ? FOR UPDATE", [bookingId]);
    if (!redemption || redemption.status === "released") {
      return {
        bookingId: Number(bookingId), discountAmount: money(cents(booking.discount_amount)),
        totalAmount: money(cents(booking.total_amount)), couponRemoved: false
      };
    }
    if (redemption.status === "redeemed") fail("A redeemed coupon cannot be removed", 409);
    const amount = totals(booking, 0);
    await conn.execute("UPDATE coupon_redemptions SET status = 'released' WHERE id = ?", [redemption.id]);
    await conn.execute(
      "UPDATE bookings SET discount_amount = '0.00', total_amount = ? WHERE id = ?",
      [amount.totalAmount, bookingId]);
    return {
      bookingId: Number(bookingId), currencyCode: booking.currency_code,
      subtotal: money(cents(booking.subtotal)), discountAmount: "0.00",
      taxAmount: money(cents(booking.tax_amount)), totalAmount: amount.totalAmount,
      couponRemoved: true
    };
  });
}

// Call from the trusted payment-success webhook, inside the SAME transaction that marks payment successful.
async function markCouponRedeemed(conn, bookingId) {
  await conn.execute(
    `UPDATE coupon_redemptions SET status = 'redeemed'
      WHERE booking_id = ? AND status = 'reserved'`, [bookingId]);
}

// Call from trusted cancellation/failure/expiry handling when the booking will no longer be payable.
// Do not release on a transient gateway retry.
async function releaseCoupon(conn, bookingId) {
  await conn.execute(
    `UPDATE coupon_redemptions SET status = 'released'
      WHERE booking_id = ? AND status = 'reserved'`, [bookingId]);
}

// Recalculate the payable amount after any trusted server-side tax/subtotal change.
// Use this within the same transaction as that price change; never accept amounts from the client.
async function recalculateBooking(conn, bookingId) {
  const [[booking]] = await conn.execute(
    `SELECT subtotal, tax_amount FROM bookings WHERE id = ? FOR UPDATE`, [bookingId]);
  if (!booking) fail("Booking not found", 404);
  const [[redemption]] = await conn.execute(
    `SELECT discount_amount, status FROM coupon_redemptions
      WHERE booking_id = ? FOR UPDATE`, [bookingId]);
  const discount = redemption && ["reserved", "redeemed"].includes(redemption.status)
    ? cents(redemption.discount_amount) : 0;
  const result = totals(booking, discount);
  await conn.execute(
    "UPDATE bookings SET discount_amount = ?, total_amount = ? WHERE id = ?",
    [result.discountAmount, result.totalAmount, bookingId]);
  return result;
}

async function getPricing({ bookingId, userId }) {
  const [[booking]] = await pool.execute(
    `SELECT b.id, b.currency_code, b.subtotal, b.discount_amount, b.tax_amount,
            b.total_amount, b.booking_status, cr.status AS coupon_status,
            c.code AS coupon_code
       FROM bookings b
       LEFT JOIN coupon_redemptions cr ON cr.booking_id = b.id
       LEFT JOIN coupons c ON c.id = cr.coupon_id
      WHERE b.id = ? AND b.user_id = ?`, [bookingId, userId]);
  if (!booking) fail("Booking not found", 404);
  return booking;
}

module.exports = {
  applyCoupon, removeCoupon, getPricing, markCouponRedeemed, releaseCoupon, recalculateBooking
};
