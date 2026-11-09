const REQUIRED = ["DB_HOST", "DB_USER", "DB_NAME"];
function validateEnv(env = process.env) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    const error = new Error(`Missing required environment variables: ${missing.join(", ")}`);
    error.code = "ENV_VALIDATION_ERROR";
    throw error;
  }
  if (env.NODE_ENV === "production" && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
    const error = new Error("Production requires JWT_SECRET with at least 32 characters");
    error.code = "ENV_VALIDATION_ERROR";
    throw error;
  }
  if (env.CORS_ORIGINS && env.CORS_ORIGINS.split(",").some((origin) => !/^https?:\/\/[^,\s]+$/.test(origin.trim()))) {
    const error = new Error("CORS_ORIGINS must be a comma-separated list of http(s) origins");
    error.code = "ENV_VALIDATION_ERROR";
    throw error;
  }
  return true;
}
module.exports = { validateEnv };
