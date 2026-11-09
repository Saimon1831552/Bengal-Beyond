const env = require("./config/env");
const app = require("./app");
const { testConnection, closePool } = require("./config/db");
const logger = require("./utils/logger");

async function start() {
  try {
    await testConnection();
    logger.info("Database connected", { database: env.DB_NAME });
  } catch (error) {
    logger.error("Database connection failed", { error: error.message });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`, { env: env.NODE_ENV });
  });

  let shuttingDown = false;

  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down`);

    // Stop taking new requests, let running ones finish, then close the DB pool.
    server.close(async () => {
      await closePool();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) =>
    logger.error("Unhandled promise rejection", { reason: String(reason) })
  );
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

start();