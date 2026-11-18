const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../../src/config/db");
const support = require("../../src/modules/support/support.service");

test("public staff replies queue an email, while internal notes do not", async (t) => {
  const originalGetConnection = pool.getConnection;
  const queued = [];
  let messageId = 40;
  const ticket = {
    ticket_reference: "BB-TEST",
    subject: "Contact form question",
    user_id: null,
    email: "guest@example.com",
    name: "Guest Customer",
  };
  const conn = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql, params) => {
      if (sql.includes("SELECT id, status FROM support_tickets")) return [[{ id: 12, status: "open" }]];
      if (sql.includes("INSERT INTO support_messages")) return [{ insertId: ++messageId }];
      if (sql.includes("SELECT t.ticket_reference")) return [[ticket]];
      if (sql.includes("INSERT INTO notification_jobs")) {
        queued.push(params);
        return [{ insertId: 5 }];
      }
      return [{ affectedRows: 1 }];
    },
  };
  pool.getConnection = async () => conn;
  t.after(() => { pool.getConnection = originalGetConnection; });

  const result = await support.addStaffMessage(12, 3, "Please contact us for help.", false);
  assert.deepEqual(result, { ticketId: 12, messageAdded: true, internal: false });
  assert.equal(queued.length, 1);
  assert.equal(queued[0][0], null);
  assert.equal(queued[0][1], "email");
  assert.equal(queued[0][2], "guest@example.com");
  assert.equal(queued[0][3], "support_reply");
  assert.match(queued[0][4], /Please contact us for help\./);
  assert.equal(queued[0][5], "support_reply:41");

  const internalResult = await support.addStaffMessage(12, 3, "Internal note.", true);
  assert.deepEqual(internalResult, { ticketId: 12, messageAdded: true, internal: true });
  assert.equal(queued.length, 1);
});
