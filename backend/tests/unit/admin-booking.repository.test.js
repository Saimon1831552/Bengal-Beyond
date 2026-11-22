const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../../src/config/db");
const repository = require("../../src/modules/bookings/admin-booking.repository");

test("summary returns booking counts, discounts, latest bookings, and bookings needing action", async (t) => {
  const originalExecute = pool.execute;
  const calls = [];
  pool.execute = async (sql) => {
    calls.push(sql);
    if (sql.includes("AS last_7_days")) {
      return [[{
        today: "3",
        last_7_days: "9",
        pending_review: "2",
        awaiting_payment: "1",
        guest_30d: "4",
        member_30d: "5",
      }]];
    }
    if (sql.includes("SUM(discount_amount)")) {
      return [[{ currency_code: "BDT", amount: "120.00" }]];
    }
    if (sql.includes("LIMIT 10")) return [[{ id: 1 }]];
    return [[{ id: 2 }]];
  };
  t.after(() => { pool.execute = originalExecute; });

  assert.deepEqual(await repository.summary(), {
    counts: {
      today: 3,
      last_7_days: 9,
      pending_review: 2,
      awaiting_payment: 1,
      guest_30d: 4,
      member_30d: 5,
    },
    discounts30d: [{ currencyCode: "BDT", amount: "120.00" }],
    latest: [{ id: 1 }],
    needsAction: [{ id: 2 }],
  });
  assert.equal(calls.length, 4);
  assert.match(calls[2], /ORDER BY b\.created_at DESC, b\.id DESC LIMIT 10/);
  assert.match(calls[3], /booking_status = 'pending_review'.*ORDER BY b\.created_at ASC, b\.id ASC LIMIT 8/s);
});

test("cancelling converted bookings releases seats, while expiring unpaid bookings only releases holds", async (t) => {
  const originalGetConnection = pool.getConnection;
  t.after(() => { pool.getConnection = originalGetConnection; });

  const setupConnection = ({ bookingStatus, paymentStatus, convertedCount }) => {
    const calls = [];
    pool.getConnection = async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      execute: async (sql, params) => {
        calls.push({ sql, params });
        if (sql.startsWith("SELECT id, booking_status")) {
          return [[{ id: 42, booking_status: bookingStatus, payment_status: paymentStatus }]];
        }
        if (sql.startsWith("SELECT COUNT(*) AS c FROM seat_holds")) {
          return [[{ c: convertedCount }]];
        }
        if (sql.startsWith("SELECT id, user_id, booking_reference")) {
          return [[{
            id: 42, user_id: 7, booking_reference: "BB-TEST", customer_name: "Guest",
            customer_email: "guest@example.test", currency_code: "BDT", total_amount: "100.00",
          }]];
        }
        if (sql.startsWith("SELECT bi.quantity, bi.tour_snapshot")) {
          return [[{ quantity: 2, tour_snapshot: '{"title":"Test tour"}', starts_at: null }]];
        }
        if (sql.startsWith("INSERT INTO notification_jobs")) {
          return [{ insertId: 1 }];
        }
        if (sql.startsWith("UPDATE bookings")) {
          return [{ affectedRows: 1 }];
        }
        return [{ affectedRows: 1 }];
      },
    });
    return calls;
  };

  const convertedCalls = setupConnection({
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    convertedCount: "1",
  });
  assert.deepEqual(await repository.updateStatus(42, "cancelled", 7, "Customer request"), {
    updated: true,
    status: "cancelled",
  });

  const convertedSql = convertedCalls.map(({ sql }) => sql);
  const historyIndex = convertedSql.findIndex((sql) => sql.includes("INSERT INTO booking_status_history"));
  const departureIndex = convertedSql.findIndex((sql) => sql.includes("UPDATE tour_departures"));
  const holdIndex = convertedSql.findIndex((sql) => sql.includes("UPDATE seat_holds"));
  const couponIndex = convertedSql.findIndex((sql) => sql.includes("UPDATE coupon_redemptions"));
  assert.ok(historyIndex < departureIndex && departureIndex < holdIndex && holdIndex < couponIndex);
  assert.match(convertedSql[departureIndex], /GREATEST\(d\.seats_reserved - bi\.quantity, 0\)/);
  const queuedMail = convertedCalls.find(({ sql }) => sql.startsWith("INSERT INTO notification_jobs"));
  assert.equal(queuedMail.params[3], "booking_cancelled");

  const unpaidCalls = setupConnection({
    bookingStatus: "awaiting_payment",
    paymentStatus: "unpaid",
    convertedCount: 0,
  });
  assert.deepEqual(await repository.updateStatus(42, "expired", 7, "Payment window expired"), {
    updated: true,
    status: "expired",
  });

  const unpaidSql = unpaidCalls.map(({ sql }) => sql);
  assert.equal(unpaidSql.some((sql) => sql.includes("UPDATE tour_departures")), false);
  assert.ok(unpaidSql.some((sql) => sql.includes("UPDATE seat_holds")));
  assert.ok(unpaidSql.some((sql) => sql.includes("UPDATE coupon_redemptions")));
});
