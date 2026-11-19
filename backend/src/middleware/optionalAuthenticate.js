const authenticate = require("./authenticate");

// No token = guest. A token that is present must be valid (so expired tokens still get refreshed).
module.exports = function optionalAuthenticate(req, res, next) {
  if (!req.get("authorization")) return next();
  return authenticate(req, res, next);
};