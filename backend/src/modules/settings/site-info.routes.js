const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const { pool } = require("../../config/db");
const { SETTING_DEFINITIONS } = require("./admin-settings.service");

// Only values that are safe to show to everyone
const KEYS = ["site_name", "support_email", "support_phone", "support_url",
  "maintenance_mode", "maintenance_message", "max_booking_party_size", "member_discount_percent"];

const router = express.Router();
router.get("/", asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT setting_key, setting_value FROM admin_settings WHERE setting_key IN (${KEYS.map(() => "?").join(",")})`, KEYS);
  const stored = new Map();
  for (const r of rows) { try { stored.set(r.setting_key, JSON.parse(r.setting_value)); } catch { /* use default */ } }
  const out = {};
  for (const k of KEYS) out[k] = stored.get(k) ?? SETTING_DEFINITIONS[k].defaultValue;
  res.set("Cache-Control", "public, max-age=30");
  return sendSuccess(res, out);
}));
module.exports = router;