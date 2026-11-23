const express = require("express");
const { pool, testConnection } = require("../config/db");
const asyncHandler = require("../utils/asynchandler");
const { sendSuccess } = require("../utils/response");

const router = express.Router();

// Liveness: is the process up? (no database call)
router.get("/", (req, res) =>
  sendSuccess(res, { status: "ok", uptimeSeconds: Math.round(process.uptime()) })
);

// Readiness: can it reach the database?
router.get(
  "/ready",
  asyncHandler(async (req, res) => {
    const database = await testConnection();
    return sendSuccess(res, { status: "ready", database });
  })
);

// Operations queue summary: background emails & payment webhooks
router.get(
  "/queues",
  asyncHandler(async (req, res) => {
    const [[notifications]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
         SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM notification_jobs`
    );

    const [[webhooks]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN processing_status = 'received' THEN 1 ELSE 0 END) AS received,
         SUM(CASE WHEN processing_status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM payment_webhook_events`
    );

    return sendSuccess(res, {
      notifications: {
        queued: Number(notifications.queued || 0),
        processing: Number(notifications.processing || 0),
        failed: Number(notifications.failed || 0),
      },
      webhooks: {
        received: Number(webhooks.received || 0),
        failed: Number(webhooks.failed || 0),
      },
    });
  })
);

module.exports = router;