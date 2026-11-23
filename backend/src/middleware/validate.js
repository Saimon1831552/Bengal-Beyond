const { ZodError } = require("zod");
const AppError = require("../utils/appError");

/**
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 * Parsed & coerced values replace the original request objects AND populate
 * req.validated so both patterns work seamlessly.
 */
function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    try {
      req.validated = req.validated || {};
      if (params) {
        req.params = params.parse(req.params);
        req.validated.params = req.params;
      }
      if (query) {
        req.query = query.parse(req.query);
        req.validated.query = req.query;
      }
      if (body) {
        req.body = body.parse(req.body);
        req.validated.body = req.body;
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join(".") || "root",
          message: i.message,
        }));
        const firstMsg = issues[0] ? `${issues[0].field}: ${issues[0].message}` : "Invalid request input.";
        const appErr = AppError.badRequest(firstMsg, "VALIDATION_ERROR");
        appErr.details = issues;
        return next(appErr);
      }
      return next(err);
    }
  };
}

module.exports = validate;