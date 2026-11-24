const { test } = require("node:test");
const assert = require("node:assert/strict");
const db = require("../../src/config/db");

// Stub booking-events before requiring booking.service
const bookingEventsPath = require.resolve("../../src/modules/notifications/booking-events");
const originalBookingEvents = require.cache[bookingEventsPath];
require.cache[bookingEventsPath] = {
  id: bookingEventsPath,
  filename: bookingEventsPath,
  loaded: true,
  exports: { queueBookingEmail: async () => {} },
};
const bookingService = require("../../src/modules/bookings/booking.service");
if (originalBookingEvents) require.cache[bookingEventsPath] = originalBookingEvents;
else delete require.cache[bookingEventsPath];

const departureService = require("../../src/modules/departure-availability/departure.service");
const webhookService = require("../../src/modules/payment-webhooks/webhook.service");
const { processOne } = require("../../src/modules/notifications/notification.worker");
const sslcommerzRouter = require("../../src/modules/sslcommerz/sslcommerz.routes");

test("P0-2: sslcommerz.routes.js no longer exposes duplicate /ipn endpoint", () => {
  const registeredPaths = sslcommerzRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);

  assert.equal(registeredPaths.includes("/ipn"), false);
  assert.deepEqual(registeredPaths.sort(), ["/cancel", "/fail", "/success"]);
});

test("P0-3: createBooking expires stale seat holds AND syncs unpaid booking status + history", async () => {
  const calls = [];
  const departure = {
    id: 12,
    tour_id: 7,
    starts_at: new Date(Date.now() + 86400_000),
    seat_capacity: 10,
    seats_reserved: 2,
    price_override: null,
    departure_status: "scheduled",
    title: "Sundarbans",
    destination: "Khulna",
    duration_days: 3,
    base_price: "5000.00",
    currency_code: "BDT",
    tour_status: "published",
    deleted_at: null,
  };

  const mockConn = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    query: async (sql, params = []) => {
      const s = sql.replace(/\s+/g, " ").trim();
      calls.push({ sql: s, params });
      if (s.includes("SELECT request_hash, booking_id")) return [[], []];
      if (s.includes("SELECT d.id")) return [[departure], []];
      if (s.includes("SELECT h.id, h.booking_id, b.booking_status")) {
        return [[{ id: 91, booking_id: 305, booking_status: "pending_review" }], []];
      }
      if (s.startsWith("UPDATE bookings SET booking_status = 'expired'")) return [{ affectedRows: 1 }, []];
      if (s.includes("SELECT COALESCE(SUM(quantity)")) return [[{ held: 0 }], []];
      if (s.startsWith("INSERT INTO bookings")) return [{ insertId: 400 }, []];
      if (s.startsWith("INSERT INTO booking_items")) return [{ insertId: 500 }, []];
      if (s.startsWith("INSERT INTO seat_holds")) return [{ insertId: 600 }, []];
      if (s.includes("FROM bookings WHERE id = ?")) return [[{ id: 400, expires_at: new Date() }], []];
      return [{ affectedRows: 1 }, []];
    },
  };

  const origGetConn = db.pool.getConnection;
  db.pool.getConnection = async () => mockConn;
  try {
    await bookingService.createBooking({
      userId: null,
      idempotencyKey: "sync-expiry-test-key",
      departureId: 12,
      quantity: 1,
      customerName: "Test User",
      customerEmail: "user@example.com",
      customerPhone: "+8801700000000",
      addonIds: [],
      travelers: [{ traveler_name: "Test User", traveler_type: "adult", nationality: null }],
    });
  } finally {
    db.pool.getConnection = origGetConn;
  }

  const holdExpire = calls.find((c) => c.sql.startsWith("UPDATE seat_holds SET hold_status = 'expired'"));
  const bookingExpire = calls.find((c) => c.sql.startsWith("UPDATE bookings SET booking_status = 'expired'"));
  const historyInsert = calls.find(
    (c) => c.sql.startsWith("INSERT INTO booking_status_history") && c.params[1] === "pending_review"
  );

  assert.deepEqual(holdExpire.params, [91]);
  assert.deepEqual(bookingExpire.params, [305]);
  assert.deepEqual(historyInsert.params, [305, "pending_review"]);
});

test("P0-1: notification.worker passes all 3 SQL bind parameters on delivery failure", async (t) => {
  const origGetConn = db.pool.getConnection;
  const origExecute = db.pool.execute;
  const executed = [];

  t.after(() => {
    db.pool.getConnection = origGetConn;
    db.pool.execute = origExecute;
  });

  db.pool.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql, params = []) => {
      const s = sql.replace(/\s+/g, " ").trim();
      executed.push({ sql: s, params });
      if (s.startsWith("SELECT * FROM notification_jobs")) {
        return [[{
          id: 88,
          template_key: "missing_template_key",
          channel: "email",
          recipient: "fail@example.com",
          payload_json: "{}",
          attempts: 0,
          max_attempts: 5,
        }]];
      }
      return [{ affectedRows: 1 }];
    },
  });

  db.pool.execute = async (sql, params = []) => {
    const s = sql.replace(/\s+/g, " ").trim();
    executed.push({ sql: s, params });
    if (s.startsWith("SELECT * FROM notification_templates")) return [[]];
    return [{ affectedRows: 1 }];
  };

  const didWork = await processOne();
  assert.equal(didWork, true);

  const attemptInsert = executed.find((q) => q.sql.startsWith("INSERT INTO notification_attempts"));
  assert.ok(attemptInsert, "expected failed attempt row insert");
  assert.equal((attemptInsert.sql.match(/\?/g) || []).length, attemptInsert.params.length);
  assert.equal(attemptInsert.params[0], 88);
  assert.equal(attemptInsert.params[1], 1);
  assert.match(attemptInsert.params[2], /Active template not found/);
});

test("P2-1: webhook.service listEvents interpolates integer LIMIT/OFFSET without unbound placeholders", async (t) => {
  const origExecute = db.pool.execute;
  let captured = null;
  t.after(() => { db.pool.execute = origExecute; });

  db.pool.execute = async (sql, params) => {
    captured = { sql: sql.replace(/\s+/g, " ").trim(), params };
    return [[]];
  };

  await webhookService.listEvents({ page: "2", limit: "10", status: "failed" });
  assert.match(captured.sql, /LIMIT 10 OFFSET 10$/);
  assert.deepEqual(captured.params, ["failed"]);
});

test("Runtime fix: departure.service exports listForTour and availability", () => {
  assert.equal(typeof departureService.listForTour, "function");
  assert.equal(typeof departureService.listByTour, "function");
  assert.equal(typeof departureService.availability, "function");
});