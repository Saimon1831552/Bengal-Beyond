const db = require("../../config/db");
const AppError = require("../../utils/appError");
const { paginationMeta } = require("../../utils/pagination");

const SETTING_DEFINITIONS = Object.freeze({
  site_name: {
    category: "general",
    label: "Site name",
    type: "string",
    defaultValue: "Bangle Beyond",
    max: 120,
  },
  support_email: {
    category: "contact",
    label: "Support email",
    type: "email",
    defaultValue: "",
    max: 254,
  },
  support_phone: {
    category: "contact",
    label: "Support phone",
    type: "string",
    defaultValue: "",
    max: 40,
  },
  support_url: {
    category: "contact",
    label: "Support URL",
    type: "url",
    defaultValue: "",
    max: 500,
  },
  default_currency: {
    category: "booking",
    label: "Default currency",
    type: "currency",
    defaultValue: "USD",
  },
  booking_cancellation_enabled: {
    category: "booking",
    label: "Allow booking cancellations",
    type: "boolean",
    defaultValue: false,
  },
  booking_cancellation_window_hours: {
    category: "booking",
    label: "Cancellation notice window (hours)",
    type: "integer",
    defaultValue: 24,
    min: 0,
    max: 8760,
  },
  booking_cancellation_fee_percent: {
    category: "booking",
    label: "Cancellation fee (%)",
    type: "number",
    defaultValue: 0,
    min: 0,
    max: 100,
  },
  max_booking_party_size: {
    category: "booking",
    label: "Maximum travelers per booking",
    type: "integer",
    defaultValue: 10,
    min: 1,
    max: 100,
  },
  maintenance_mode: {
    category: "operations",
    label: "Maintenance mode",
    type: "boolean",
    defaultValue: false,
  },
  maintenance_message: {
    category: "operations",
    label: "Maintenance notice",
    type: "string",
    defaultValue: "We are performing scheduled maintenance. Please try again soon.",
    max: 500,
  },
});

function validateSetting(key, value) {
  const definition = SETTING_DEFINITIONS[key];
  if (!definition) {
    throw AppError.badRequest("This setting key is not editable through the admin API.", undefined, "SETTING_NOT_EDITABLE");
  }

  if (definition.type === "boolean") {
    if (typeof value !== "boolean") {
      throw AppError.badRequest(`${key} must be a boolean.`);
    }
    return value;
  }

  if (definition.type === "integer" || definition.type === "number") {
    const validNumber = definition.type === "integer"
      ? Number.isInteger(value)
      : typeof value === "number" && Number.isFinite(value);
    if (!validNumber || value < definition.min || value > definition.max) {
      throw AppError.badRequest(
        `${key} must be a ${definition.type} between ${definition.min} and ${definition.max}.`,
      );
    }
    return value;
  }

  if (typeof value !== "string" || value.length > definition.max) {
    throw AppError.badRequest(`${key} must be a string of at most ${definition.max} characters.`);
  }

  const normalized = value.trim();
  if (!normalized && (key === "support_email" || key === "support_phone" || key === "support_url")) {
    return "";
  }
  if (!normalized) {
    throw AppError.badRequest(`${key} must not be empty.`);
  }

  if (definition.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw AppError.badRequest("support_email must be a valid email address.");
  }
  if (definition.type === "currency" && !/^[A-Z]{3}$/.test(normalized)) {
    throw AppError.badRequest("default_currency must be a three-letter uppercase currency code.");
  }
  if (definition.type === "url") {
    let parsed;
    try {
      parsed = new URL(normalized);
    } catch {
      throw AppError.badRequest("support_url must be an absolute HTTP or HTTPS URL.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw AppError.badRequest("support_url must use HTTP or HTTPS.");
    }
  }
  return normalized;
}

function parseStoredValue(value) {
  return JSON.parse(value);
}

async function list({ category, search }) {
  const [rows] = await db.pool.execute(
    "SELECT setting_key, setting_value, updated_by, updated_at FROM admin_settings",
  );
  const stored = new Map(rows.map((row) => [row.setting_key, row]));

  return Object.entries(SETTING_DEFINITIONS)
    .filter(([key, definition]) => !category || definition.category === category)
    .filter(([key, definition]) => (
      !search ||
      key.toLowerCase().includes(search.toLowerCase()) ||
      definition.label.toLowerCase().includes(search.toLowerCase())
    ))
    .map(([key, definition]) => {
      const row = stored.get(key);
      return {
        key,
        category: definition.category,
        label: definition.label,
        type: definition.type,
        value: row ? parseStoredValue(row.setting_value) : definition.defaultValue,
        isDefault: !row,
        updatedAt: row?.updated_at || null,
        updatedBy: row?.updated_by || null,
      };
    });
}

async function updateSettings(settings, actorId, reason) {
  const entries = Object.entries(settings).map(([key, value]) => [key, validateSetting(key, value)]);
  if (entries.length === 0) {
    throw AppError.badRequest("Provide at least one setting to update.", undefined, "EMPTY_SETTINGS_UPDATE");
  }

  const normalizedReason = reason?.trim() || null;
  const result = await db.withTransaction(async (connection) => {
    const updates = [];
    for (const [key, value] of entries) {
      const [[current]] = await connection.execute(
        "SELECT setting_value FROM admin_settings WHERE setting_key = ? FOR UPDATE",
        [key],
      );
      const oldValue = current ? parseStoredValue(current.setting_value) : SETTING_DEFINITIONS[key].defaultValue;
      if (JSON.stringify(oldValue) === JSON.stringify(value)) continue;
      const serialized = JSON.stringify(value);

      await connection.execute(
        `INSERT INTO admin_settings (setting_key, setting_value, updated_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value),
           updated_by = VALUES(updated_by),
           updated_at = CURRENT_TIMESTAMP`,
        [key, serialized, actorId],
      );
      await connection.execute(
        `INSERT INTO audit_logs
           (actor_user_id, action, entity_type, entity_id, before_data, after_data)
         VALUES (?, 'settings.update', 'admin_setting', NULL, ?, ?)`,
        [
          actorId,
          JSON.stringify({ key, value: oldValue }),
          JSON.stringify({ key, value, reason: normalizedReason }),
        ],
      );
      updates.push({ key, value, category: SETTING_DEFINITIONS[key].category });
    }
    return { updated: updates, updatedCount: updates.length };
  });
  if (entries.some(([key]) => key === "maintenance_mode" || key === "maintenance_message")) {
    require("./maintenance-mode").clearCache();
  }
  return result;
}

async function history({ page, limit, key }) {
  const conditions = ["log.action = 'settings.update'", "log.entity_type = 'admin_setting'"];
  const params = [];
  if (key) {
    if (!Object.prototype.hasOwnProperty.call(SETTING_DEFINITIONS, key)) {
      throw AppError.badRequest("Unknown setting key.", undefined, "SETTING_NOT_EDITABLE");
    }
    conditions.push("JSON_UNQUOTE(JSON_EXTRACT(log.after_data, '$.key')) = ?");
    params.push(key);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const offset = (page - 1) * limit;
  const [[countRows], [historyRows]] = await Promise.all([
    db.pool.execute(`SELECT COUNT(*) AS total FROM audit_logs log ${where}`, params),
    db.pool.execute(
      `SELECT log.id, log.actor_user_id, actor.full_name AS actor_name,
              log.before_data, log.after_data, log.created_at
         FROM audit_logs log
         LEFT JOIN users actor ON actor.id = log.actor_user_id
        ${where}
        ORDER BY log.created_at DESC, log.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    ),
  ]);

  const total = Number(countRows[0].total);
  return {
    items: historyRows.map((row) => {
      const before = JSON.parse(row.before_data);
      const after = JSON.parse(row.after_data);
      return {
        id: row.id,
        key: after.key,
        category: SETTING_DEFINITIONS[after.key]?.category || null,
        previousValue: before.value,
        value: after.value,
        reason: after.reason,
        actor: row.actor_user_id
          ? { id: row.actor_user_id, name: row.actor_name }
          : null,
        createdAt: row.created_at,
      };
    }),
    pagination: paginationMeta({ page, limit, total }),
  };
}

module.exports = { list, updateSettings, history, validateSetting, SETTING_DEFINITIONS };
