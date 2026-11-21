const { test } = require("node:test");
const assert = require("node:assert/strict");

let connection;
const dbPath = require.resolve("../../src/config/db");
const originalDbModule = require.cache[dbPath];
const fakeDb = {
  pool: { execute: async () => { throw new Error("Unexpected pool query"); } },
  withTransaction: async (run) => run(connection),
};
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: fakeDb,
};
const pricing = require("../../src/modules/booking-pricing/pricing.service");
const coupons = require("../../src/modules/coupons/coupon.service");
if (originalDbModule) require.cache[dbPath] = originalDbModule;
else delete require.cache[dbPath];

const bookingId = 41;
const booking = () => ({
  id: bookingId,
  user_id: 9,
  booking_status: "pending_review",
  payment_status: "unpaid",
  currency_code: "USD",
  subtotal: "100.00",
  discount_amount: "28.00",
  member_discount_amount: "10.00",
  tax_amount: "5.00",
  total_amount: "77.00",
});
const coupon = {
  id: 12,
  code: "SAVE20",
  status: "active",
  discount_type: "percentage",
  discount_value: "20.00",
  min_order_amount: "0.00",
  max_discount_amount: null,
  usage_limit: 100,
  per_user_limit: 10,
  starts_at: null,
  ends_at: null,
};

function makeConnection({ currentBooking = booking(), redemption = null } = {}) {
  const calls = [];
  return {
    calls,
    execute: async (sql, params = []) => {
      const query = sql.replace(/\s+/g, " ").trim();
      calls.push({ query, params });
      if (query.startsWith("SELECT id, user_id")) return [[currentBooking], []];
      if (query.startsWith("SELECT subtotal, member_discount_amount")) return [[currentBooking], []];
      if (query.startsWith("SELECT * FROM coupons")) return [[coupon], []];
      if (query.startsWith("SELECT COUNT(*) AS total")) return [[{ total: 0 }], []];
      if (query.startsWith("SELECT id, coupon_id, status FROM coupon_redemptions")) {
        return [redemption ? [redemption] : [], []];
      }
      if (query.startsWith("SELECT id, status FROM coupon_redemptions")) {
        return [redemption ? [redemption] : [], []];
      }
      if (query.startsWith("SELECT discount_amount, status FROM coupon_redemptions")) {
        return [redemption ? [redemption] : [], []];
      }
      return [{ affectedRows: 1 }, []];
    },
  };
}

test("applying a coupon stacks it on the member-discounted subtotal", async () => {
  connection = makeConnection();
  const result = await pricing.applyCoupon({ bookingId, userId: 9, code: coupon.code });

  assert.equal(result.memberDiscount, "10.00");
  assert.equal(result.couponDiscount, "18.00");
  assert.equal(result.discountAmount, "28.00");
  assert.equal(result.totalAmount, "77.00");
  const redemptionInsert = connection.calls.find((call) => call.query.startsWith("INSERT INTO coupon_redemptions"));
  assert.equal(redemptionInsert.params[3], "18.00");
  const bookingUpdate = connection.calls.find((call) => call.query.startsWith("UPDATE bookings"));
  assert.deepEqual(bookingUpdate.params, ["28.00", "77.00", bookingId]);
});

test("removing a coupon preserves the member discount", async () => {
  connection = makeConnection({ redemption: { id: 6, status: "reserved" } });
  const result = await pricing.removeCoupon({ bookingId, userId: 9 });

  assert.equal(result.discountAmount, "10.00");
  assert.equal(result.totalAmount, "95.00");
  const bookingUpdate = connection.calls.find((call) => call.query.startsWith("UPDATE bookings"));
  assert.deepEqual(bookingUpdate.params, ["10.00", "95.00", bookingId]);
});

test("recalculation preserves member and reserved coupon discounts", async () => {
  connection = makeConnection({ redemption: { discount_amount: "18.00", status: "reserved" } });
  const result = await pricing.recalculateBooking(connection, bookingId);

  assert.deepEqual(result, { discountAmount: "28.00", totalAmount: "77.00" });
  const bookingUpdate = connection.calls.find((call) => call.query.startsWith("UPDATE bookings"));
  assert.deepEqual(bookingUpdate.params, ["28.00", "77.00", bookingId]);
});

test("coupon validation calculates the coupon against the member-discounted base", async () => {
  connection = makeConnection();
  const result = await coupons.validateForBooking({ code: coupon.code, bookingId, userId: 9 });

  assert.equal(result.discountAmount, "18.00");
  assert.equal(result.estimatedTotal, "77.00");
});
