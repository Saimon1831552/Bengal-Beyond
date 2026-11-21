const { test } = require("node:test");
const assert = require("node:assert/strict");

const queuePath = require.resolve("../../src/modules/notifications/notification.queue");
const originalQueueModule = require.cache[queuePath];
const queued = [];
require.cache[queuePath] = {
  id: queuePath,
  filename: queuePath,
  loaded: true,
  exports: { enqueue: async (job) => queued.push(job) },
};
const { queueBookingEmail } = require("../../src/modules/notifications/booking-events");
if (originalQueueModule) require.cache[queuePath] = originalQueueModule;
else delete require.cache[queuePath];

function makeConnection(userId) {
  return {
    execute: async (sql) => sql.includes("FROM bookings")
      ? [[{
          id: 41,
          user_id: userId,
          booking_reference: "BB-TEST",
          customer_name: "Test Traveller",
          customer_email: "test@example.com",
          currency_code: "USD",
          total_amount: 180,
        }], []]
      : [[{
          quantity: 2,
          tour_snapshot: JSON.stringify({ title: "Test tour" }),
          starts_at: "2026-11-28T08:00:00.000Z",
        }], []],
  };
}

test("booking emails provide member and guest-specific next steps", async () => {
  queued.length = 0;
  await queueBookingEmail(makeConnection(9), 41, "booking_received", { hold_minutes: "60" });
  const memberPayload = queued[0].payload;
  assert.match(memberPayload.booking_url, /\/bookings\/41$/);
  assert.equal(memberPayload.view_line, `View your booking: ${memberPayload.booking_url}`);
  assert.equal(
    memberPayload.next_step,
    `Please complete your payment within 60 minutes to keep your seats: ${memberPayload.booking_url}`,
  );

  queued.length = 0;
  await queueBookingEmail(makeConnection(null), 41, "booking_received", { hold_minutes: "1440" });
  const guestPayload = queued[0].payload;
  assert.match(guestPayload.view_line, /Questions\? Contact us: .*\/contact$/);
  assert.equal(
    guestPayload.next_step,
    "Our team will review your booking and contact you by email or phone to arrange payment.",
  );
});
