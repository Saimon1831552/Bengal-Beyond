const { test } = require("node:test");
const assert = require("node:assert/strict");
const service = require("../../src/modules/settings/admin-settings.service");
const {
  listQuery,
  historyQuery,
  updateBody,
  bulkUpdateBody,
} = require("../../src/modules/settings/admin-settings.schema");
const maintenance = require("../../src/modules/settings/maintenance-mode");

test("admin settings list and history queries are constrained", () => {
  assert.deepEqual(listQuery.parse({ category: "booking", search: "party" }), {
    category: "booking",
    search: "party",
  });
  assert.deepEqual(historyQuery.parse({ page: "2", limit: "10", key: "site_name" }), {
    page: 2,
    limit: 10,
    key: "site_name",
  });
  assert.throws(() => listQuery.parse({ category: "secrets" }));
  assert.throws(() => historyQuery.parse({ key: "smtp_password" }));
});

test("setting update bodies require JSON values and accept optional audit reasons", () => {
  assert.deepEqual(updateBody.parse({ value: false, reason: "Site maintenance" }), {
    value: false,
    reason: "Site maintenance",
  });
  assert.deepEqual(bulkUpdateBody.parse({
    settings: { maintenance_mode: true, max_booking_party_size: 12 },
  }), {
    settings: { maintenance_mode: true, max_booking_party_size: 12 },
  });
  assert.throws(() => updateBody.parse({}));
  assert.throws(() => bulkUpdateBody.parse({ settings: {} }));
});

test("settings enforce allowlisted types and range/url validation", () => {
  assert.equal(service.validateSetting("maintenance_mode", true), true);
  assert.equal(service.validateSetting("max_booking_party_size", 24), 24);
  assert.equal(service.validateSetting("support_url", "https://help.example.com"), "https://help.example.com");
  assert.equal(service.validateSetting("support_email", ""), "");
  assert.throws(() => service.validateSetting("max_booking_party_size", 0), { code: "BAD_REQUEST" });
  assert.throws(() => service.validateSetting("maintenance_mode", "true"), { code: "BAD_REQUEST" });
  assert.throws(() => service.validateSetting("default_currency", "usd"), { code: "BAD_REQUEST" });
  assert.throws(() => service.validateSetting("support_url", "javascript:alert(1)"), { code: "BAD_REQUEST" });
  assert.throws(() => service.validateSetting("smtp_password", "secret"), { code: "SETTING_NOT_EDITABLE" });
});

test("admin settings exposes a grouped, default-filled configuration catalog", async (t) => {
  const db = require("../../src/config/db");
  const originalPool = db.pool;
  db.pool = {
    execute: async () => [[{
      setting_key: "site_name",
      setting_value: '"New Site"',
      updated_by: "2",
      updated_at: "2026-10-17 10:00:00",
    }]],
  };
  t.after(() => { db.pool = originalPool; });

  const result = await service.list({});
  const siteName = result.find((setting) => setting.key === "site_name");
  const currency = result.find((setting) => setting.key === "default_currency");

  assert.equal(siteName.value, "New Site");
  assert.equal(siteName.isDefault, false);
  assert.equal(currency.value, "USD");
  assert.equal(currency.isDefault, true);
  assert.equal(result.some((setting) => /password|secret|token/i.test(setting.key)), false);
});

test("bulk settings update is transactional and audits each changed value", async (t) => {
  const db = require("../../src/config/db");
  const originalTransaction = db.withTransaction;
  const originalPool = db.pool;
  const calls = [];
  db.pool = originalPool;
  db.withTransaction = async (work) => work({
    execute: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT setting_value")) {
        return [[{ setting_value: "false" }]];
      }
      return [{ affectedRows: 1 }];
    },
  });
  t.after(() => {
    db.withTransaction = originalTransaction;
    db.pool = originalPool;
  });

  const result = await service.updateSettings(
    { maintenance_mode: true, max_booking_party_size: 12 },
    1,
    "Scheduled release",
  );

  assert.equal(result.updatedCount, 2);
  assert.equal(calls.filter((call) => call.sql.includes("INSERT INTO admin_settings")).length, 2);
  assert.equal(calls.filter((call) => call.sql.includes("INSERT INTO audit_logs")).length, 2);
  assert.equal(calls.find((call) => call.sql.includes("INSERT INTO admin_settings")).params[1], "true");
  const firstAudit = calls.find((call) => call.sql.includes("INSERT INTO audit_logs"));
  assert.equal(JSON.parse(firstAudit.params[1]).value, false);
  assert.equal(JSON.parse(firstAudit.params[2]).value, true);
});

test("maintenance mode blocks public API traffic but leaves health and admin routes available", async (t) => {
  const { pool } = require("../../src/config/db");
  const originalExecute = pool.execute;
  pool.execute = async () => [[
    { setting_key: "maintenance_mode", setting_value: "true" },
    { setting_key: "maintenance_message", setting_value: '"Maintenance in progress."' },
  ]];
  maintenance.clearCache();
  t.after(() => {
    pool.execute = originalExecute;
    maintenance.clearCache();
  });

  let continued = false;
  await maintenance.maintenanceMode({ path: "/health/ready" }, {}, () => { continued = true; });
  assert.equal(continued, true);
  await maintenance.maintenanceMode({ path: "/admin/settings" }, {}, () => { continued = true; });
  assert.equal(continued, true);

  await assert.rejects(
    maintenance.maintenanceMode({ path: "/auth/login" }, {}, () => {}),
    (error) => error.statusCode === 503 && error.message === "Maintenance in progress.",
  );
});
