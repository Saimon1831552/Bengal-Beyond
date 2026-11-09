// Small reusable request-size guard. Keep route-specific schema validation in each module.
module.exports = function requestValidation({ maxJsonBytes = "1mb" } = {}) {
  return function validateRequestSize(req, res, next) {
    const length = Number(req.headers["content-length"] || 0);
    const max = typeof maxJsonBytes === "number"
      ? maxJsonBytes
      : Number.parseInt(maxJsonBytes, 10) * (maxJsonBytes.toLowerCase().includes("mb") ? 1024 * 1024 : 1024);
    if (Number.isFinite(length) && length > max) {
      return res.status(413).json({ success: false, message: "Request body is too large" });
    }
    next();
  };
};
