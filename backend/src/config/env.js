const dotenv = require("dotenv");

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,

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

module.exports = env;