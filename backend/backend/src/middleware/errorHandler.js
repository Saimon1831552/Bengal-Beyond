const AppError = require("../utils/appError");
const env = require("../config/env");
const logger = require("../utils/logger");

// Turns known library/database errors into AppErrors with a safe message.
// Raw SQL text is never sent to the client.
function mapKnownError(error) {
  if (error instanceof AppError) return error;

  // body-parser
  if (error.type === "entity.parse.failed") {
    return AppError.badRequest("Request body is not valid JSON.", undefined, "INVALID_JSON");
  }
  if (error.type === "entity.too.large") {
    return new AppError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  }

  // CHECK constraint failures. Match by error NUMBER, not name: the mysql2 driver
  // only knows MySQL's error table, so MariaDB's 4025 arrives with a wrong name.
  if (error.errno === 3819 /* MySQL 8 */ || error.errno === 4025 /* MariaDB */) {
    return new AppError(422, "CONSTRAINT_VIOLATION", "The values do not satisfy a data rule.");
  }

  // MySQL / MariaDB (mysql2)
  switch (error.code) {
    case "ER_DUP_ENTRY":
      return AppError.conflict("A record with these values already exists.", undefined, "DUPLICATE_ENTRY");
    case "ER_NO_REFERENCED_ROW_2":
      return AppError.badRequest("A referenced record does not exist.", undefined, "INVALID_REFERENCE");
    case "ER_ROW_IS_REFERENCED_2":
      return AppError.conflict("This record is still in use and cannot be removed.", undefined, "RECORD_IN_USE");
    case "ER_LOCK_DEADLOCK":
    case "ER_LOCK_WAIT_TIMEOUT":
      return new AppError(503, "TRY_AGAIN", "The system is busy. Please try again.");
    default:
      return null;
  }
}

function buildErrorBody(error, { requestId, isProduction }) {
  const mapped = mapKnownError(error);

  if (mapped) {
    const body = { code: mapped.code, message: mapped.message, requestId };
    if (mapped.details !== undefined) body.details = mapped.details;
    return { status: mapped.statusCode, body: { success: false, error: body } };
  }

  // Unknown error = a bug. Never leak its message in production.
  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: isProduction ? "Something went wrong." : error.message,
        requestId,
      },
    },
  };
}

// Express recognises an error handler by its 4 arguments. Do not remove `next`.
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const { status, body } = buildErrorBody(error, {
    requestId: req.id,
    isProduction: env.IS_PRODUCTION,
  });

  if (status >= 500) {
    logger.error("Unhandled request error", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      errorCode: error.code,
      stack: error.stack,
    });
  }

  return res.status(status).json(body);
}

module.exports = { errorHandler, mapKnownError, buildErrorBody };