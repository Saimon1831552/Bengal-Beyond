function buildCorsOptions(env = process.env) {
  const configured = (env.CORS_ORIGINS || "")
    .split(",").map((item) => item.trim()).filter(Boolean);
  const allowlist = new Set(configured);
  return {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-API-Version"],
    origin(origin, callback) {
      // Allow server-to-server and same-origin requests without an Origin header.
      if (!origin || allowlist.has(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    }
  };
}
module.exports = { buildCorsOptions };
