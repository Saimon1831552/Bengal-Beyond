const { test } = require("node:test");
const assert = require("node:assert/strict");
const db = require("../../src/config/db");
const logger = require("../../src/utils/logger");
const { auditQuery } = require("../../src/modules/audit/admin-audit.schema");
const auditService = require("../../src/modules/audit/admin-audit.service");
const { recordSecurityEvent } = require("../../src/modules/audit/audit-logger");

test("audit filters apply safe defaults and validate values", () => {
  assert.deepEqual(auditQuery.parse({ page: "2", limit: "10", action: "auth.login" }), {
    page: 2,
    limit: 10,
    action: "auth.login",
  });
  assert.throws(() => auditQuery.parse({ limit: "101" }));
  assert.throws(() => auditQuery.parse({ actorId: "0" }));
  assert.throws(() => auditQuery.parse({ from: "not-a-date" }));
  assert.throws(() => auditQuery.parse({ unexpected: "value" }));
});

test("audit API redacts credential fields in event details", async (t) => {
  const originalQuery = db.pool.query;
  t.after(() => { db.pool.query = originalQuery; });
  let selectCalled = false;
  db.pool.query = async (sql) => {
    if (sql.includes("COUNT(*) AS total")) return [[{ total: 1 }]];
    selectCalled = true;
    return [[{
      id: 1,
      before_data: '{"password":"old","profile":{"accessToken":"abc","name":"Admin"}}',
      after_data: { refresh_token: "secret", result: "success" },
    }]];
  };

  const result = await auditService.listAuditLogs({ page: 1, limit: 20 });

  assert.equal(selectCalled, true);
  assert.deepEqual(result.items[0].before_data, {
    password: "[REDACTED]",
    profile: { accessToken: "[REDACTED]", name: "Admin" },
  });
  assert.deepEqual(result.items[0].after_data, {
    refresh_token: "[REDACTED]",
    result: "success",
  });
});

test("security audit events include request metadata without leaking raw credentials", async (t) => {
  const originalExecute = db.pool.execute;
  t.after(() => { db.pool.execute = originalExecute; });
  let captured;
  db.pool.execute = async (sql, params) => { captured = { sql, params }; };

  await recordSecurityEvent({
    action: "auth.login.failed",
    req: {
      id: "request-123",
      ip: "2001:db8::1",
      get: () => "browser-agent",
    },
    details: { outcome: "failure", reason: "invalid_credentials" },
  });

  assert.match(captured.sql, /INET6_ATON\(\?\)/);
  assert.equal(captured.params[1], "auth.login.failed");
  assert.equal(captured.params[4], "2001:db8::1");
  assert.equal(captured.params[5], "browser-agent");
  assert.equal(captured.params[6], '{"outcome":"failure","reason":"invalid_credentials"}');
});

test("security audit persistence failures are explicitly logged", async (t) => {
  const originalExecute = db.pool.execute;
  const originalError = logger.error;
  t.after(() => {
    db.pool.execute = originalExecute;
    logger.error = originalError;
  });
  let logged;
  db.pool.execute = async () => { throw new Error("database unavailable"); };
  logger.error = (message, fields) => { logged = { message, fields }; };

  await recordSecurityEvent({ action: "auth.login.failed", req: { id: "request-456" } });

  assert.equal(logged.message, "Failed to persist security audit event");
  assert.equal(logged.fields.action, "auth.login.failed");
  assert.equal(logged.fields.requestId, "request-456");
});
