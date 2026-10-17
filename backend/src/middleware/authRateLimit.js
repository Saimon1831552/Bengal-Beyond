const { rateLimit } = require("express-rate-limit");

function createAuthRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many authentication requests. Try again later." },
    },
  });
}

module.exports = {
  register: createAuthRateLimit(),
  login: createAuthRateLimit(),
  refresh: createAuthRateLimit(),
  requestVerification: createAuthRateLimit(),
  verifyEmail: createAuthRateLimit(),
  requestPasswordReset: createAuthRateLimit(),
  resetPassword: createAuthRateLimit(),
};
