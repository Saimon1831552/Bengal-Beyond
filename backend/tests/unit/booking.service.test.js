const { test } = require("node:test");
const assert = require("node:assert/strict");
const db = require("../../src/config/db");

const bookingEventsPath = require.resolve("../../src/modules/notifications/booking-events");
const originalBookingEventsModule = require.cache[bookingEventsPath];
require.cache[bookingEventsPath] = {
  id: bookingEventsPath,
  filename: bookingEventsPath,
  loaded: true,
  exports: { queueBookingEmail: async () => {} },
};
const service = require("../../src/modules/bookings/booking.service");
if (originalBookingEventsModule) require.cache[bookingEventsPath] = originalBookingEventsModule;
else delete require.cache[bookingEventsPath];

const bookingId = 41;
const booking = { id: bookingId, subtotal: 0, discount_amount: 0, total_amount: 0 };
const departure = {
  id: 12,
  tour_id: 7,
  starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  seat_capacity: 20,
  seats_reserved: 0,
  price_override: null,
  departure_status: "scheduled",
  title: "Test tour",
  destination: "Test destination",
  duration_days: 3,
  base_price: "100.25",
  currency_code: "USD",
  tour_status: "published",
  deleted_at: null,
};

function makeConnection({ settingRows = [[], []], priorRows = [], oldBooking = null } = {}) {
  const calls = [];
  return {
    calls,
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    query: async (sql, params = []) => {
      const normalizedSql = sql.replace(/\s+/g, " ").trim();
      calls.push({ sql: normalizedSql, params });
      if (normalizedSql.includes("SELECT request_hash, booking_id")) return [priorRows, []];
      if (normalizedSql.includes("FROM bookings WHERE id = ? AND")) return [[oldBooking], []];
      if (normalizedSql.includes("SELECT d.id")) return [[departure], []];
      if (normalizedSql.includes("SELECT setting_value")) return settingRows;
      if (normalizedSql.includes("SELECT COALESCE(SUM(quantity)")) return [[{ held: 0 }], []];
      if (normalizedSql.startsWith("INSERT INTO bookings")) {
        return [{
          insertId: bookingId,
          params,
        }, []];
      }
      if (normalizedSql.startsWith("INSERT INTO seat_holds")) return [{ insertId: 71 }, []];
      if (normalizedSql.includes("FROM bookings WHERE id = ?")) {
        return [[{
          ...booking,
          subtotal: params[0] === bookingId ? 0 : booking.subtotal,
        }], []];
      }
      return [{ affectedRows: 1 }, []];
    },
  };
}

function payload(userId) {
  return {
    userId,
    idempotencyKey: "booking-key-001",
    departureId: 12,
    quantity: 2,
    customerName: "Test Traveller",
    customerEmail: "test@example.com",
    customerPhone: "+880123456789",
    customerNationality: null,
    travelers: [
      { traveler_name: "Traveller One", traveler_type: "adult", nationality: null },
      { traveler_name: "Traveller Two", traveler_type: "adult", nationality: null },
    ],
  };
}

async function createWithConnection(connection, bookingPayload) {
  const originalGetConnection = db.pool.getConnection;
  db.pool.getConnection = async () => connection;
  try {
    return await service.createBooking(bookingPayload);
  } finally {
    db.pool.getConnection = originalGetConnection;
  }
}

test("guest bookings have no member discount and use null-owner idempotency queries", async () => {
  const connection = makeConnection();
  await createWithConnection(connection, payload(null));

  const priorQuery = connection.calls.find((call) => call.sql.includes("SELECT request_hash, booking_id"));
  const idempotencyInsert = connection.calls.find((call) => call.sql.startsWith("INSERT INTO booking_idempotency_keys"));
  const bookingInsert = connection.calls.find((call) => call.sql.startsWith("INSERT INTO bookings"));
  const idempotencyUpdate = connection.calls.find((call) => call.sql.startsWith("UPDATE booking_idempotency_keys"));

  assert.match(priorQuery.sql, /WHERE user_id IS NULL AND idempotency_key/);
  assert.deepEqual(priorQuery.params, ["booking-key-001"]);
  assert.equal(idempotencyInsert.params[0], null);
  assert.equal(bookingInsert.params[0], null);
  assert.equal(bookingInsert.params[7], 200.5);
  assert.equal(bookingInsert.params[8], 0);
  assert.equal(bookingInsert.params[9], 0);
  assert.equal(bookingInsert.params[10], 200.5);
  assert.match(bookingInsert.sql, /member_discount_amount/);
  assert.equal((bookingInsert.sql.match(/\?/g) || []).length, bookingInsert.params.length);
  assert.match(idempotencyUpdate.sql, /WHERE user_id IS NULL AND idempotency_key/);
  assert.deepEqual(idempotencyUpdate.params, [bookingId, "booking-key-001"]);
  assert.equal(connection.calls.some((call) => call.sql.includes("SELECT setting_value")), false);

  const replayConnection = makeConnection({
    priorRows: [{ request_hash: idempotencyInsert.params[2], booking_id: bookingId }],
    oldBooking: { id: bookingId },
  });
  const replay = await createWithConnection(replayConnection, payload(null));
  const replayLookup = replayConnection.calls.find((call) => call.sql.includes("FROM bookings WHERE id = ? AND"));
  assert.equal(replay.replayed, true);
  assert.equal(replay.booking.id, bookingId);
  assert.match(replayLookup.sql, /WHERE id = \? AND user_id IS NULL/);
  assert.deepEqual(replayLookup.params, [bookingId]);
});

test("guest booking holds default to 24 hours and configured values are clamped", async () => {
  const previous = process.env.GUEST_BOOKING_HOLD_MINUTES;
  try {
    delete process.env.GUEST_BOOKING_HOLD_MINUTES;
    const defaults = makeConnection();
    await createWithConnection(defaults, payload(null));
    const defaultBookingInsert = defaults.calls.find((call) => call.sql.startsWith("INSERT INTO bookings"));
    const defaultHoldInsert = defaults.calls.find((call) => call.sql.startsWith("INSERT INTO seat_holds"));
    assert.equal(defaultBookingInsert.params[11], 1440);
    assert.equal(defaultHoldInsert.params[3], 1440);

    for (const [configured, expected] of [["30", 60], ["20000", 10080]]) {
      process.env.GUEST_BOOKING_HOLD_MINUTES = configured;
      const connection = makeConnection();
      await createWithConnection(connection, payload(null));
      const bookingInsert = connection.calls.find((call) => call.sql.startsWith("INSERT INTO bookings"));
      const holdInsert = connection.calls.find((call) => call.sql.startsWith("INSERT INTO seat_holds"));
      assert.equal(bookingInsert.params[11], expected);
      assert.equal(holdInsert.params[3], expected);
    }
  } finally {
    if (previous === undefined) delete process.env.GUEST_BOOKING_HOLD_MINUTES;
    else process.env.GUEST_BOOKING_HOLD_MINUTES = previous;
  }
});

test("member discount is read from settings and applied using cent-based rounding", async () => {
  const previousHoldMinutes = process.env.BOOKING_HOLD_MINUTES;
  process.env.BOOKING_HOLD_MINUTES = "15";
  const connection = makeConnection({ settingRows: [[{ setting_value: "10" }], []] });
  try {
    await createWithConnection(connection, payload(9));
  } finally {
    if (previousHoldMinutes === undefined) delete process.env.BOOKING_HOLD_MINUTES;
    else process.env.BOOKING_HOLD_MINUTES = previousHoldMinutes;
  }

  const bookingInsert = connection.calls.find((call) => call.sql.startsWith("INSERT INTO bookings"));
  assert.equal(bookingInsert.params[7], 200.5);
  assert.equal(bookingInsert.params[8], 20.05);
  assert.equal(bookingInsert.params[9], 20.05);
  assert.equal(bookingInsert.params[10], 180.45);
  assert.equal(bookingInsert.params[11], 15);
  const itemInsert = connection.calls.find((call) => call.sql.startsWith("INSERT INTO booking_items"));
  assert.equal(itemInsert.params[5], 200.5);
});

test("members use the default five percent discount when no setting row exists", async () => {
  const connection = makeConnection();
  await createWithConnection(connection, payload(9));

  const bookingInsert = connection.calls.find((call) => call.sql.startsWith("INSERT INTO bookings"));
  assert.equal(bookingInsert.params[8], 10.03);
  assert.equal(bookingInsert.params[9], 10.03);
  assert.equal(bookingInsert.params[10], 190.47);
});
