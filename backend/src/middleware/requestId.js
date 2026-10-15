const crypto = require("crypto");

const SAFE_ID = /^[A-Za-z0-9._-]{8,100}$/;

// Gives every request an id, returned in the X-Request-Id header and in
// every error body, so "it failed" can be matched to one log line.
module.exports = function requestId(req, res, next) {
  const incoming = req.get("x-request-id");
  req.id = incoming && SAFE_ID.test(incoming) ? incoming : crypto.randomUUID();
  res.set("X-Request-Id", req.id);
  next();
};