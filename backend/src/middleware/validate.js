const { ZodError } = require("zod");
const AppError = require("../utils/AppError");

function formatIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * validate({ params, query, body })  each value is a zod schema (all optional).
 * Parsed (coerced, defaulted, trimmed) values are put on req.validated.
 * Read req.validated.body, not req.body, in controllers.
 */
module.exports = function validate(schemas) {
  return (req, res, next) => {
    try {
      const validated = {};

      for (const part of ["params", "query", "body"]) {
        if (schemas[part]) validated[part] = schemas[part].parse(req[part]);
      }

      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) return next(AppError.validation(formatIssues(error)));
      return next(error);
    }
  };
};