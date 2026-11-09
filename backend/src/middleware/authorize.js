const { pool } = require("../config/db");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asynchandler");
const { recordSecurityEvent } = require("../modules/audit/audit-logger");

/**
 * Usage: router.get("/admin", authenticate, authorize("dashboard.read"), handler)
 * Permissions are resolved from the database on every request so permission
 * changes and role removals take effect without waiting for a token to expire.
 */
function authorize(...requiredPermissions) {
  if (
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) => typeof permission !== "string" || !permission.trim())
  ) {
    throw new TypeError("authorize() requires at least one non-empty permission key.");
  }

  return asyncHandler(async function authorizeRequest(req, res, next) {
    if (!req.auth || !req.auth.userId) {
      throw AppError.unauthorized("Authentication is required.", "AUTHENTICATION_REQUIRED");
    }

    const placeholders = requiredPermissions.map(() => "?").join(", ");
    const [rows] = await pool.execute(
      `SELECT DISTINCT p.permission_key
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = ?
          AND p.permission_key IN (${placeholders})`,
      [req.auth.userId, ...requiredPermissions],
    );

    const granted = new Set(rows.map((row) => row.permission_key));
    const missing = requiredPermissions.filter((permission) => !granted.has(permission));
    if (missing.length) {
      await recordSecurityEvent({
        action: "auth.permission.denied",
        actorUserId: req.auth.userId,
        req,
        details: { outcome: "denied", permissions: missing, method: req.method, path: req.path },
      });
      throw AppError.forbidden("You do not have permission to perform this action.", "INSUFFICIENT_PERMISSION");
    }

    req.auth.permissions = [...new Set([...(req.auth.permissions || []), ...requiredPermissions])];
    return next();
  });
}

module.exports = authorize;
