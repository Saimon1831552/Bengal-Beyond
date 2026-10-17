const express = require("express");
const { testConnection } = require("../config/db");
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

module.exports = router;