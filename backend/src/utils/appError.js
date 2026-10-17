/**
 * An error we EXPECT and can safely show to the client.
 * Anything that is not an AppError is treated as a bug (HTTP 500).
 */
class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message = "Bad request.", details, code = "BAD_REQUEST") {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = "Authentication required.", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }

  static forbidden(message = "You do not have permission to do this.", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }

  static notFound(message = "Resource not found.", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }

  static conflict(message = "Conflict.", details, code = "CONFLICT") {
    return new AppError(409, code, message, details);
  }

  static validation(details, message = "Validation failed.") {
    return new AppError(422, "VALIDATION_ERROR", message, details);
  }
}

module.exports = AppError;