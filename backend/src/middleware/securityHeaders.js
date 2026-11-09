const helmet = require("helmet");

// Apply before API routes. Configure CSP origins for any docs/uploads domain used by your app.
module.exports = function securityHeaders() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
};
