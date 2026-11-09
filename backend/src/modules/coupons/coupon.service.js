const { pool, withTransaction } = require("../../config/db");
function err(message, statusCode) { const e = new Error(message); e.statusCode = statusCode; throw e; }
const columns = `id, code, name, description, discount_type AS discountType,
  discount_value AS discountValue, min_order_amount AS minOrderAmount,
  max_discount_amount AS maxDiscountAmount, usage_limit AS usageLimit,
  per_user_limit AS perUserLimit, starts_at AS startsAt, ends_at AS endsAt,
  status, created_at AS createdAt, updated_at AS updatedAt`;

async function list({ q, status, limit, offset }) {
  const where = [], params = [];
  if (q) { where.push("(code LIKE ? OR name LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (status) { where.push("status = ?"); params.push(status); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM coupons ${clause}`, params);
  const [rows] = await pool.execute(
    `SELECT ${columns} FROM coupons ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { items: rows, pagination: { total: Number(count.total), limit, page: Math.floor(offset / limit) + 1,
    totalPages: Math.max(1, Math.ceil(Number(count.total) / limit)) } };
}
async function get(id) {
  const [[row]] = await pool.execute(`SELECT ${columns} FROM coupons WHERE id = ?`, [id]);
  if (!row) err("Coupon not found", 404);
  return row;
}
async function create(data) {
  const [r] = await pool.execute(
    `INSERT INTO coupons
      (code, name, description, discount_type, discount_value, min_order_amount,
       max_discount_amount, usage_limit, per_user_limit, starts_at, ends_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.code, data.name, data.description, data.discountType, data.discountValue,
     data.minOrderAmount, data.maxDiscountAmount, data.usageLimit, data.perUserLimit,
     data.startsAt, data.endsAt, data.status]
  );
  return get(r.insertId);
}
async function update(id, data) {
  await get(id);
  const map = {
    name: "name", description: "description", discountType: "discount_type",
    discountValue: "discount_value", minOrderAmount: "min_order_amount",
    maxDiscountAmount: "max_discount_amount", usageLimit: "usage_limit",
    perUserLimit: "per_user_limit", startsAt: "starts_at", endsAt: "ends_at", status: "status"
  };
  const sets = [], values = [];
  for (const [key, column] of Object.entries(map)) {
    if (data[key] !== undefined) { sets.push(`${column} = ?`); values.push(data[key]); }
  }
  if (sets.length) await pool.execute(`UPDATE coupons SET ${sets.join(", ")} WHERE id = ?`, [...values, id]);
  return get(id);
}
async function remove(id) {
  await get(id);
  const [[used]] = await pool.execute("SELECT COUNT(*) AS total FROM coupon_redemptions WHERE coupon_id = ?", [id]);
  if (Number(used.total) > 0) err("Coupon has redemption history; deactivate it instead", 409);
  await pool.execute("DELETE FROM coupons WHERE id = ?", [id]);
}
async function validateForBooking({ code, bookingId, userId }) {
  return withTransaction(async (conn) => {
    const [[booking]] = await conn.execute(
      `SELECT id, user_id, subtotal, discount_amount, tax_amount, total_amount, booking_status
       FROM bookings WHERE id = ? FOR UPDATE`, [bookingId]);
    if (!booking) err("Booking not found", 404);
    if (booking.user_id !== userId) err("Booking does not belong to the authenticated customer", 403);
    if (!["pending_review", "awaiting_payment"].includes(booking.booking_status)) {
      err("Coupon can only be checked for a booking awaiting review or payment", 409);
    }
    const [[coupon]] = await conn.execute(
      "SELECT * FROM coupons WHERE code = ? FOR UPDATE", [code]);
    if (!coupon || coupon.status !== "active") err("Coupon is invalid or inactive", 404);
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) err("Coupon is not active yet", 409);
    if (coupon.ends_at && new Date(coupon.ends_at) < now) err("Coupon has expired", 409);
    if (Number(booking.subtotal) < Number(coupon.min_order_amount)) err("Booking subtotal does not meet the coupon minimum", 409);
    const [[usage]] = await conn.execute(
      `SELECT COUNT(*) AS total FROM coupon_redemptions
       WHERE coupon_id = ? AND status IN ('reserved','redeemed')`, [coupon.id]);
    if (coupon.usage_limit !== null && Number(usage.total) >= Number(coupon.usage_limit)) err("Coupon usage limit has been reached", 409);
    const [[userUsage]] = await conn.execute(
      `SELECT COUNT(*) AS total FROM coupon_redemptions
       WHERE coupon_id = ? AND user_id = ? AND status IN ('reserved','redeemed')`, [coupon.id, userId]);
    if (Number(userUsage.total) >= Number(coupon.per_user_limit)) err("Your coupon usage limit has been reached", 409);
    let discount = coupon.discount_type === "percentage"
      ? Number(booking.subtotal) * Number(coupon.discount_value) / 100
      : Number(coupon.discount_value);
    if (coupon.max_discount_amount !== null) discount = Math.min(discount, Number(coupon.max_discount_amount));
    discount = Math.min(discount, Number(booking.subtotal));
    discount = Math.round((discount + Number.EPSILON) * 100) / 100;
    const totalAfterDiscount = Math.max(0, Number(booking.subtotal) - discount + Number(booking.tax_amount));
    return {
      valid: true, coupon: { id: coupon.id, code: coupon.code, discountType: coupon.discount_type },
      subtotal: booking.subtotal, discountAmount: discount.toFixed(2),
      taxAmount: booking.tax_amount, estimatedTotal: totalAfterDiscount.toFixed(2),
      note: "Validation preview only. This endpoint does not apply the coupon or reserve usage."
    };
  });
}
module.exports = { list, get, create, update, remove, validateForBooking };
