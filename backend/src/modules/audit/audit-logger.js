const { pool } = require("../../config/db");
const logger = require("../../utils/logger");

async function recordSecurityEvent({ action, req, actorUserId = null, entityId = null, details = {} }) {
  const requestId = typeof req?.id === "string" ? req.id.slice(0, 100) : null;
  const ipAddress = typeof req?.ip === "string" ? req.ip.slice(0, 45) : null;
  const userAgent = typeof req?.get === "function"
    ? req.get("user-agent")
    : req?.headers?.["user-agent"];

  try {
    await pool.execute(
      `INSERT INTO audit_logs
         (actor_user_id, action, entity_type, entity_id, request_id, ip_address, user_agent, after_data)
       VALUES (?, ?, 'auth', ?, ?, INET6_ATON(?), ?, ?)`,
      [
        actorUserId,
        action,
        entityId,
        requestId,
        ipAddress,
        typeof userAgent === "string" ? userAgent.slice(0, 500) : null,
        JSON.stringify(details),
      ],
    );
  } catch (error) {
    logger.error("Failed to persist security audit event", {
      action,
      requestId,
      error: error.message,
    });
  }
}

module.exports = { recordSecurityEvent };
