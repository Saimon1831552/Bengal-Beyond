const { runWorker } = require("../modules/notifications/notification.worker");

async function start() {
  console.log("Bengal Beyond notification worker starting...");

  const { promise } = await runWorker({
    pollMs: 3000,
    batchSize: 10
  });

  await promise;
}

start().catch((error) => {
  console.error("Notification worker stopped:", error);
  process.exit(1);
});