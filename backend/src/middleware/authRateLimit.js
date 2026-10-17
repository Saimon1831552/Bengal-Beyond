const { rateLimit } = require("express-rate-limit");

// Mount on auth endpoints; configure Express proxy trust only for known proxies.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many authentication requests. Try again later." },
  },
});

module.exports = authRateLimit;
