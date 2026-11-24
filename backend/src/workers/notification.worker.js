const { runWorker } = require("../modules/notifications/notification.worker");
const { pool } = require("../config/db");

async function start() {
  console.log("Bengal Beyond notification worker starting...");

  const worker = await runWorker({
    pollMs: 3000,
    batchSize: 10,
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down notification worker gracefully...`);
    if (typeof worker.stop === "function") {
      await worker.stop();
    }
    await pool.end();
    process.exit(0);
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  await worker.promise;
}

start().catch((error) => {
  console.error("Notification worker stopped:", error);
  process.exit(1);
});