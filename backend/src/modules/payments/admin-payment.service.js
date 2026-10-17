const db = require("../../config/db");

const ALLOWED_STATUSES = new Set(["initiated", "pending", "succeeded", "failed", "cancelled"]);

function httpError(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  return error;
}
function positiveId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) throw httpError(400, "Invalid payment id.");
  return String(value);
}
function getPool() {
  return db.pool || db;
}
async function query(sql, params = [], conn = null) {
  const target = conn || getPool();
  if (typeof target.execute === "function") return target.execute(sql, params);
  if (typeof target.query === "function") return target.query(sql, params);
  throw new Error("Database module must export a mysql2 pool or connection.");
}
async function rows(sql, params = [], conn = null) {
  const result = await query(sql, params, conn);
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
}
async function getConnection() {
  const pool = getPool();
  return typeof pool.getConnection === "function" ? pool.getConnection() : null;
}
async function list(queryParams) {
  const page = Math.max(1, Math.min(100000, Number.parseInt(queryParams.page, 10) || 1));
  const limit = Math.max(1, Math.min(100, Number.parseInt(queryParams.limit, 10) || 20));
  const where = [];
  const params = [];
  if (queryParams.status) {
    if (!ALLOWED_STATUSES.has(queryParams.status)) throw httpError(400, "Invalid payment status.");
    where.push("p.status = ?");
    params.push(queryParams.status);
  }
  if (queryParams.booking_id) {
    if (!/^[1-9]\d*$/.test(String(queryParams.booking_id))) throw httpError(400, "Invalid booking_id.");
    where.push("p.booking_id = ?");
    params.push(queryParams.booking_id);
  }
  if (queryParams.provider) {
    where.push("p.provider = ?");
    params.push(String(queryParams.provider).slice(0, 50));
  }
  if (queryParams.from) {
    if (Number.isNaN(Date.parse(queryParams.from))) throw httpError(400, "Invalid from date.");
    where.push("p.created_at >= ?");
    params.push(queryParams.from);
  }
  if (queryParams.to) {
    if (Number.isNaN(Date.parse(queryParams.to))) throw httpError(400, "Invalid to date.");
    where.push("p.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(queryParams.to);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countRows = await rows(`SELECT COUNT(*) AS total FROM payments p ${clause}`, params);
  const data = await rows(
    `SELECT p.id, p.booking_id, b.booking_reference, p.provider, p.provider_payment_id,
            p.amount, p.currency_code, p.status, p.verified_at, p.created_at, p.updated_at
       FROM payments p
       LEFT JOIN bookings b ON b.id = p.booking_id
       ${clause}
      ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  return { data, pagination: { page, limit, total: Number(countRows[0]?.total || 0), pages: Math.ceil(Number(countRows[0]?.total || 0) / limit) } };
}
async function getById(id, conn = null) {
  id = positiveId(id);
  const found = await rows(
    `SELECT p.id, p.booking_id, b.booking_reference, b.booking_status, b.payment_status AS booking_payment_status,
            p.provider, p.provider_payment_id, p.idempotency_key, p.amount, p.currency_code,
            p.status, p.verified_at, p.created_at, p.updated_at
       FROM payments p LEFT JOIN bookings b ON b.id = p.booking_id WHERE p.id = ? LIMIT 1`,
    [id], conn
  );
  if (!found.length) throw httpError(404, "Payment not found.");
  return found[0];
}
async function mutate(id, actorId, note, targetStatus) {
  id = positiveId(id);
  const conn = await getConnection();
  const run = async (c) => {
    const found = await rows("SELECT id, booking_id, status FROM payments WHERE id = ? FOR UPDATE", [id], c);
    if (!found.length) throw httpError(404, "Payment not found.");
    const payment = found[0];
    if (payment.status === targetStatus) return getById(id, c);
    if (payment.status === "succeeded" || payment.status === "cancelled") {
      throw httpError(409, `Cannot change a ${payment.status} payment through this endpoint.`);
    }
    if (targetStatus === "succeeded") {
      await query("UPDATE payments SET status = 'succeeded', verified_at = CURRENT_TIMESTAMP WHERE id = ?", [id], c);
      await query("UPDATE bookings SET payment_status = 'paid' WHERE id = ?", [payment.booking_id], c);
    } else {
      await query("UPDATE payments SET status = 'failed' WHERE id = ?", [id], c);
      const remaining = await rows(
        "SELECT COUNT(*) AS count FROM payments WHERE booking_id = ? AND status = 'succeeded' AND id <> ?",
        [payment.booking_id, id], c
      );
      if (Number(remaining[0]?.count || 0) === 0) {
        await query("UPDATE bookings SET payment_status = 'failed' WHERE id = ?", [payment.booking_id], c);
      }
    }
    // Keep a record of the administrative action without storing payment-provider payloads.
    try {
      await query(
        `INSERT INTO audit_logs
           (actor_user_id, action, entity_type, entity_id, before_data, after_data)
         VALUES (?, ?, 'payment', ?, ?, ?)`,
        [actorId, targetStatus === "succeeded" ? "payment.admin_verify" : "payment.admin_mark_failed", id,
         JSON.stringify({ status: payment.status }),
         JSON.stringify({
           bookingId: payment.booking_id,
           status: targetStatus,
           note: note ? String(note).slice(0, 500) : null,
         })], c
      );
    } catch (e) {
      // Some existing schemas use a different audit_logs shape; payment state remains transactional
      // and the caller still receives an error if the database transaction itself fails.
      if (e.code !== "ER_BAD_FIELD_ERROR" && e.code !== "ER_NO_SUCH_TABLE") throw e;
    }
    return getById(id, c);
  };
  if (!conn) return run(null);
  try {
    await conn.beginTransaction();
    const result = await run(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
exports.list = list;
exports.getById = getById;
exports.verify = (id, actorId, note) => mutate(id, actorId, note, "succeeded");
exports.markFailed = (id, actorId, note) => mutate(id, actorId, note, "failed");
