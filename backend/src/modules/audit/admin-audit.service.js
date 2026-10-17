const { pool } = require("../../config/db");

function parseFilters(query = {}) {
  const page = Math.max(1, Math.min(1000000, Number.parseInt(query.page, 10) || 1));
  const limit = Math.max(1, Math.min(100, Number.parseInt(query.limit, 10) || 25));
  const filters = [];
  const params = [];
  if (query.actorId !== undefined && query.actorId !== "") {
    const actorId = Number(query.actorId);
    if (!Number.isSafeInteger(actorId) || actorId < 1) throw Object.assign(new Error("actorId must be a positive integer."), { status: 400, code: "INVALID_FILTER" });
    filters.push("a.actor_user_id = ?");
    params.push(actorId);
  }
  if (query.from) {
    if (!isValidDate(query.from)) throw Object.assign(new Error("from must be a valid date or ISO datetime."), { status: 400, code: "INVALID_FILTER" });
    filters.push("a.created_at >= ?");
    params.push(normalizeFrom(query.from));
  }
  if (query.to) {
    if (!isValidDate(query.to)) throw Object.assign(new Error("to must be a valid date or ISO datetime."), { status: 400, code: "INVALID_FILTER" });
    filters.push("a.created_at <= ?");
    params.push(normalizeTo(query.to));
  }
  if (query.action) {
    filters.push("a.action LIKE ?");
    params.push(`%${String(query.action).slice(0, 120)}%`);
  }
  if (query.entityType) {
    filters.push("a.entity_type = ?");
    params.push(String(query.entityType).slice(0, 80));
  }
  if (query.entityId !== undefined && query.entityId !== "") {
    const entityId = Number(query.entityId);
    if (!Number.isSafeInteger(entityId) || entityId < 1) throw Object.assign(new Error("entityId must be a positive integer."), { status: 400, code: "INVALID_FILTER" });
    filters.push("a.entity_id = ?");
    params.push(entityId);
  }
  if (query.requestId) {
    filters.push("a.request_id = ?");
    params.push(String(query.requestId).slice(0, 100));
  }
  if (query.search) {
    const search = `%${String(query.search).slice(0, 160)}%`;
    filters.push("(a.action LIKE ? OR a.entity_type LIKE ? OR CAST(a.entity_id AS CHAR) LIKE ? OR a.request_id LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)");
    params.push(search, search, search, search, search, search);
  }
  if (query.securityOnly === "true") {
    filters.push("(a.action REGEXP '(login|logout|auth|password|token|permission|role|suspend|failed|denied|security|rate.?limit|csrf|reset)' OR a.entity_type REGEXP '(auth|session|user|role|permission|security|token|login)')");
  }
  return { page, limit, filters, params };
}
function isValidDate(value) { return !Number.isNaN(Date.parse(value)); }
function normalizeFrom(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value} 00:00:00` : new Date(value).toISOString().slice(0, 19).replace("T", " "); }
function normalizeTo(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value} 23:59:59` : new Date(value).toISOString().slice(0, 19).replace("T", " "); }

const selectColumns = `
  a.id, a.actor_user_id, u.full_name AS actor_name, u.email AS actor_email,
  a.action, a.entity_type, a.entity_id, a.request_id,
  CASE WHEN a.ip_address IS NULL THEN NULL ELSE INET6_NTOA(a.ip_address) END AS ip_address,
  a.user_agent, a.before_data, a.after_data, a.created_at`;

async function runList(query, securityOnly = false) {
  const f = parseFilters({ ...query, ...(securityOnly ? { securityOnly: "true" } : {}) });
  const where = f.filters.length ? `WHERE ${f.filters.join(" AND ")}` : "";
  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ${where}`,
    f.params
  );
  const offset = (f.page - 1) * f.limit;
  const [items] = await pool.query(
    `SELECT ${selectColumns} FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ${where}
     ORDER BY a.created_at DESC, a.id DESC LIMIT ? OFFSET ?`,
    [...f.params, f.limit, offset]
  );
  return { items: items.map(decodeJson), meta: { page: f.page, limit: f.limit, total: Number(countRow.total), totalPages: Math.ceil(Number(countRow.total) / f.limit) } };
}
function decodeJson(row) {
  for (const key of ["before_data", "after_data"]) {
    if (typeof row[key] === "string") {
      try { row[key] = JSON.parse(row[key]); } catch (_) { continue; }
    }
    row[key] = redactSensitiveValues(row[key]);
  }
  return row;
}
function redactSensitiveValues(value) {
  if (Array.isArray(value)) return value.map(redactSensitiveValues);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    /password|passphrase|token|secret|credential|authorization|cookie|private.?key|access.?key/i.test(key)
      ? "[REDACTED]"
      : redactSensitiveValues(nested),
  ]));
}
exports.listAuditLogs = (query) => runList(query, false);
exports.listSecurityEvents = (query) => runList(query, true);

exports.getAuditLog = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${selectColumns} FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id WHERE a.id = ? LIMIT 1`, [id]
  );
  return rows[0] ? decodeJson(rows[0]) : null;
};

exports.securitySummary = async () => {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total_events,
      SUM(CASE WHEN a.created_at >= UTC_TIMESTAMP() - INTERVAL 24 HOUR THEN 1 ELSE 0 END) AS events_last_24h,
      SUM(CASE WHEN a.created_at >= UTC_TIMESTAMP() - INTERVAL 24 HOUR
        AND (a.action REGEXP '(login|auth|password|token|permission|role|failed|denied|security|reset)'
          OR a.entity_type REGEXP '(auth|session|user|role|permission|security|token|login)')
        THEN 1 ELSE 0 END) AS security_events_last_24h,
      COUNT(DISTINCT CASE WHEN a.created_at >= UTC_TIMESTAMP() - INTERVAL 24 HOUR THEN a.actor_user_id END) AS active_actors_24h
    FROM audit_logs a
    WHERE a.created_at >= UTC_TIMESTAMP() - INTERVAL 30 DAY
  `);
  const [topActions] = await pool.query(`
    SELECT action, COUNT(*) AS count
    FROM audit_logs
    WHERE created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY
    GROUP BY action ORDER BY count DESC LIMIT 10
  `);
  const [[failedLoginStats]] = await pool.query(`
    SELECT COUNT(*) AS failed_login_attempts,
           COUNT(DISTINCT ip_address) AS distinct_failed_login_ips
      FROM audit_logs
     WHERE action = 'auth.login.failed'
       AND created_at >= UTC_TIMESTAMP() - INTERVAL 24 HOUR
  `);
  const [topFailedLoginIps] = await pool.query(`
    SELECT INET6_NTOA(ip_address) AS ip_address, COUNT(*) AS attempts
      FROM audit_logs
     WHERE action = 'auth.login.failed'
       AND ip_address IS NOT NULL
       AND created_at >= UTC_TIMESTAMP() - INTERVAL 24 HOUR
     GROUP BY ip_address
     ORDER BY attempts DESC
     LIMIT 10
  `);
  return { windowDays: 30, ...rows[0], total_events: Number(rows[0].total_events || 0),
    events_last_24h: Number(rows[0].events_last_24h || 0),
    security_events_last_24h: Number(rows[0].security_events_last_24h || 0),
    active_actors_24h: Number(rows[0].active_actors_24h || 0),
    failed_login_attempts: Number(failedLoginStats.failed_login_attempts || 0),
    distinct_failed_login_ips: Number(failedLoginStats.distinct_failed_login_ips || 0),
    topFailedLoginIps: topFailedLoginIps.map((row) => ({
      ipAddress: row.ip_address,
      attempts: Number(row.attempts),
    })),
    topActions: topActions.map(r => ({ action: r.action, count: Number(r.count) })) };
};
