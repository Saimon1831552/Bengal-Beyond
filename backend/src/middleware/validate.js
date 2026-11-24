const { ZodError } = require("zod");
const AppError = require("../utils/appError");

/**
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 * Parsed & coerced values replace the original request objects AND populate
 * req.validated so both patterns work seamlessly in Express 5.
 */
function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    try {
      req.validated = req.validated || {};
      if (params) {
        const parsedParams = params.parse(req.params);
        req.params = parsedParams;
        req.validated.params = parsedParams;
      }
      if (query) {
        const parsedQuery = query.parse(req.query);
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        req.validated.query = parsedQuery;
      }
      if (body) {
        const parsedBody = body.parse(req.body);
        req.body = parsedBody;
        req.validated.body = parsedBody;
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join(".") || "root",
          message: i.message,
        }));
        const firstMsg = issues[0] ? `${issues[0].field}: ${issues[0].message}` : "Invalid request input.";
        return next(AppError.validation(issues, firstMsg));
      }
      return next(err);
    }
  };
}

module.exports = validate;