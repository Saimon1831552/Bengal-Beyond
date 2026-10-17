const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const env = require("../config/env");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asynchandler");
const { recordSecurityEvent } = require("../modules/audit/audit-logger");

const ISSUER = "bengal-beyond-api";
const AUDIENCE = "bengal-beyond-client";

/**
 * Requires a valid Phase 2.1 access token and an active database account.
 * Sets req.auth = { userId, email, roles } and req.user to a safe user object.
 */
module.exports = asyncHandler(async function authenticate(req, res, next) {
  const header = req.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    await recordSecurityEvent({
      action: "auth.access.denied",
      req,
      details: { outcome: "denied", reason: "missing_access_token", method: req.method, path: req.path },
    });
    throw AppError.unauthorized("A valid access token is required.", "ACCESS_TOKEN_REQUIRED");
  }

  let payload;
  try {
    payload = jwt.verify(match[1], env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch {
    await recordSecurityEvent({
      action: "auth.access.denied",
      req,
      details: { outcome: "denied", reason: "invalid_access_token", method: req.method, path: req.path },
    });
    throw AppError.unauthorized("Access token is invalid or expired.", "INVALID_ACCESS_TOKEN");
  }

  if (
    !payload || payload.typ !== "access" ||
    typeof payload.sub !== "string" || !/^[1-9]\d*$/.test(payload.sub)
  ) {
    throw AppError.unauthorized("Access token is invalid or expired.", "INVALID_ACCESS_TOKEN");
  }

  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.full_name, u.account_status,
            r.role_key
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ?`,
    [payload.sub],
  );

  if (!rows.length || rows.some((row) => row.account_status !== "active")) {
    throw AppError.unauthorized("Session is no longer valid.", "INVALID_SESSION");
  }

  const first = rows[0];
  const roles = [...new Set(rows.map((row) => row.role_key).filter(Boolean))];
  req.auth = { userId: first.id, email: first.email, roles };
  req.user = {
    id: first.id,
    email: first.email,
    fullName: first.full_name,
    accountStatus: first.account_status,
    roles,
  };
  return next();
});
