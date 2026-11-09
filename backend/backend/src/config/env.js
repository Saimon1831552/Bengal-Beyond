const dotenv = require("dotenv");

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: (process.env.NODE_ENV || "development") === "production",
  PORT: Number(process.env.PORT || 5000),
  // Set to the exact number of trusted proxy hops (e.g. 1 for a single nginx proxy).
  TRUST_PROXY_HOPS: Number(process.env.TRUST_PROXY_HOPS || 0),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM,

  FRONTEND_URL:
    process.env.FRONTEND_URL || "http://localhost:3000",

  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "bengal_beyond",
  DB_CONNECTION_LIMIT: Number(
    process.env.DB_CONNECTION_LIMIT || 10
  ),
};

if (
  !Number.isInteger(env.PORT) ||
  env.PORT < 1 ||
  env.PORT > 65535
) {
  throw new Error("PORT must be a valid TCP port.");
}

if (
  !Number.isInteger(env.DB_PORT) ||
  env.DB_PORT < 1 ||
  env.DB_PORT > 65535
) {
  throw new Error("DB_PORT must be a valid TCP port.");
}

if (!Number.isInteger(env.TRUST_PROXY_HOPS) || env.TRUST_PROXY_HOPS < 0) {
  throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
}

if (
  typeof env.JWT_ACCESS_SECRET !== "string" ||
  env.JWT_ACCESS_SECRET.trim().length < 32
) {
  throw new Error("JWT_ACCESS_SECRET must be configured and at least 32 characters long.");
}

const hasSmtpPort = typeof process.env.SMTP_PORT === "string" && process.env.SMTP_PORT.length > 0;
const isValidSmtpPort =
  Number.isInteger(env.SMTP_PORT) && env.SMTP_PORT >= 1 && env.SMTP_PORT <= 65535;
if (
  hasSmtpPort &&
  !isValidSmtpPort
) {
  throw new Error("SMTP_PORT must be a valid TCP port.");
}

for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"]) {
  if (
    typeof env[key] === "string" &&
    env[key].length > 0 &&
    env[key].trim().length === 0
  ) {
    throw new Error(`${key} must not contain only whitespace.`);
  }
}

if (env.IS_PRODUCTION) {
  for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"]) {
    if (typeof env[key] !== "string" || env[key].trim().length === 0) {
      throw new Error(`${key} must be configured in production.`);
    }
  }

  if (!hasSmtpPort || !isValidSmtpPort) {
    throw new Error("SMTP_PORT must be a valid TCP port in production.");
  }
}

if (env.MAIL_FROM && /[\r\n]/.test(env.MAIL_FROM)) {
  throw new Error("MAIL_FROM must not contain line breaks.");
}

module.exports = env;