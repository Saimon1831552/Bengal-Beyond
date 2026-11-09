/**
 * Optional API version header middleware.
 * Current routes remain backward-compatible at /api/*; clients may send
 * X-API-Version: 1. Unsupported versions are rejected explicitly.
 */
module.exports = function apiVersion(req, res, next) {
  const requested = req.get('X-API-Version');
  if (!requested) return next();
  if (requested !== '1') {
    return res.status(400).json({
      success: false,
      message: `Unsupported API version '${requested}'. Supported version: 1.`,
      requestId: req.requestId
    });
  }
  res.set('X-API-Version', '1');
  res.set('Vary', 'X-API-Version');
  return next();
};
