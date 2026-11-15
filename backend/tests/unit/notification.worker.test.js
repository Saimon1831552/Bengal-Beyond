const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../../src/config/db");
const { processOne } = require("../../src/modules/notifications/notification.worker");

test("notification worker resets stale processing jobs before claiming queued jobs", async (t) => {
  const originalGetConnection = pool.getConnection;
  t.after(() => { pool.getConnection = originalGetConnection; });

  const queries = [];
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      queries.push(sql);
      if (sql.startsWith("SELECT * FROM notification_jobs")) return [[]];
      return [{ affectedRows: 1 }];
    },
  });

  assert.equal(await processOne(), false);
  assert.match(queries[0], /SET status = 'queued', locked_at = NULL/);
  assert.match(queries[0], /status = 'processing' AND locked_at < DATE_SUB\(NOW\(\), INTERVAL 10 MINUTE\)/);
  assert.match(queries[1], /WHERE status = 'queued'/);
});
