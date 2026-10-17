const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");

const CACHE_TTL_MS = 5000;
let cachedSettings;
let cacheExpiresAt = 0;

async function getMaintenanceSettings() {
  if (cachedSettings && Date.now() < cacheExpiresAt) return cachedSettings;

  const [rows] = await pool.execute(
    `SELECT setting_key, setting_value
       FROM admin_settings
      WHERE setting_key IN ('maintenance_mode', 'maintenance_message')`,
  );
  const settings = new Map(rows.map((row) => [row.setting_key, JSON.parse(row.setting_value)]));
  cachedSettings = {
    enabled: settings.get("maintenance_mode") === true,
    message: settings.get("maintenance_message") ||
      "We are performing scheduled maintenance. Please try again soon.",
  };
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return cachedSettings;
}

function clearCache() {
  cachedSettings = undefined;
  cacheExpiresAt = 0;
}

async function maintenanceMode(req, res, next) {
  if (req.path.startsWith("/health") || req.path.startsWith("/admin")) return next();

  const settings = await getMaintenanceSettings();
  if (!settings.enabled) return next();

  throw new AppError(503, "MAINTENANCE_MODE", settings.message);
}

module.exports = { maintenanceMode, getMaintenanceSettings, clearCache };
