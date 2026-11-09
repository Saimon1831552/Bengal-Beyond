const db = require("../../config/db");

const VALID_STATUSES = new Set(["active", "suspended"]);
function httpError(status, message) {
  const e = new Error(message);
  e.statusCode = status;
  return e;
}
function validId(id) {
  if (!/^[1-9]\d*$/.test(String(id))) throw httpError(400, "Invalid customer id.");
  return String(id);
}
function pool() { return db.pool || db; }
async function query(sql, params = [], conn = null) {
  const target = conn || pool();
  if (typeof target.execute === "function") return target.execute(sql, params);
  if (typeof target.query === "function") return target.query(sql, params);
  throw new Error("Database module must export a mysql2 pool or connection.");
}
async function rows(sql, params = [], conn = null) {
  const result = await query(sql, params, conn);
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
}
async function getConnection() {
  const p = pool();
  return typeof p.getConnection === "function" ? p.getConnection() : null;
}
function userStatusColumn() {
  // The supplied schema must be checked for the exact user account-status column.
  // The current scaffold assumes users.account_status with values active/suspended.
  return "account_status";
}
async function list(q) {
  const page = Math.max(1, Number.parseInt(q.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, Number.parseInt(q.limit, 10) || 20));
  const where = ["u.role_id IS NOT NULL"];
  const params = [];
  if (q.search) {
    const term = `%${String(q.search).trim().slice(0, 120)}%`;
    where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
    params.push(term, term, term);
  }
  if (q.status) {
    if (!VALID_STATUSES.has(q.status)) throw httpError(400, "Invalid customer status.");
    where.push(`u.${userStatusColumn()} = ?`);
    params.push(q.status);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const count = await rows(`SELECT COUNT(*) AS total FROM users u ${clause}`, params);
  const data = await rows(
    `SELECT u.id, u.name, u.email, u.phone, u.${userStatusColumn()} AS account_status,
            u.created_at,
            (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) AS total_bookings,
            (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id AND b.booking_status IN ('confirmed','completed')) AS confirmed_or_completed_bookings
       FROM users u ${clause}
      ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  const total = Number(count[0]?.total || 0);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
async function getById(id) {
  id = validId(id);
  const found = await rows(
    `SELECT u.id, u.name, u.email, u.phone, u.${userStatusColumn()} AS account_status, u.created_at,
            (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) AS total_bookings
       FROM users u WHERE u.id = ? LIMIT 1`,
    [id]
  );
  if (!found.length) throw httpError(404, "Customer not found.");
  const bookings = await rows(
    `SELECT b.id, b.booking_reference, b.booking_status, b.payment_status, b.total_amount,
            b.currency_code, b.created_at
       FROM bookings b WHERE b.user_id = ? ORDER BY b.created_at DESC, b.id DESC LIMIT 50`,
    [id]
  );
  return { ...found[0], bookings };
}
async function updateStatus(id, status, actorId, reason) {
  id = validId(id);
  if (!VALID_STATUSES.has(status)) throw httpError(400, "status must be 'active' or 'suspended'.");
  const conn = await getConnection();
  const execute = async (c) => {
    const found = await rows(
      `SELECT id, ${userStatusColumn()} AS account_status FROM users WHERE id = ? FOR UPDATE`,
      [id], c
    );
    if (!found.length) throw httpError(404, "Customer not found.");
    if (found[0].account_status === status) {
      return { id, account_status: status, unchanged: true };
    }
    await query(`UPDATE users SET ${userStatusColumn()} = ? WHERE id = ?`, [status, id], c);
    try {
      await query(
        `INSERT INTO audit_logs
           (actor_user_id, action, entity_type, entity_id, before_data, after_data)
         VALUES (?, ?, 'customer', ?, ?, ?)`,
        [actorId, status === "suspended" ? "customer.suspend" : "customer.activate", id,
         JSON.stringify({ accountStatus: found[0].account_status }),
         JSON.stringify({
           accountStatus: status,
           reason: reason ? String(reason).slice(0, 500) : null,
         })], c
      );
    } catch (e) {
      if (e.code !== "ER_BAD_FIELD_ERROR" && e.code !== "ER_NO_SUCH_TABLE") throw e;
    }
    return { id, account_status: status, unchanged: false };
  };
  if (!conn) return execute(null);
  try {
    await conn.beginTransaction();
    const result = await execute(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
exports.list = list;
exports.getById = getById;
exports.updateStatus = updateStatus;
