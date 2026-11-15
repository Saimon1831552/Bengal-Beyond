const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../../src/config/db");
const { getBooking } = require("../../src/modules/customer-bookings/customer-booking.service");

test("getBooking includes change requests and only customer-visible notes", async (t) => {
  const originalExecute = pool.execute;
  t.after(() => { pool.execute = originalExecute; });

  const booking = { id: 42, user_id: 7 };
  const items = [{ id: 1, quantity: 2 }];
  const travelers = [{ id: 3, traveler_name: "Guest" }];
  const holds = [{ id: 4, hold_status: "active" }];
  const changeRequests = [{ id: 5, status: "pending" }];
  const notes = [{ id: 6, note: "We received your request" }];
  const calls = [];

  pool.execute = async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes("SELECT b.* FROM bookings")) return [[booking]];
    if (sql.includes("FROM booking_items")) return [items];
    if (sql.includes("FROM booking_travelers")) return [travelers];
    if (sql.includes("FROM seat_holds")) return [holds];
    if (sql.includes("FROM booking_change_requests")) return [changeRequests];
    if (sql.includes("FROM booking_notes")) return [notes];
    throw new Error(`Unexpected query: ${sql}`);
  };

  assert.deepEqual(await getBooking(7, 42), {
    booking,
    items,
    travelers,
    active_seat_holds: holds,
    change_requests: changeRequests,
    notes,
  });

  const notesQuery = calls.find(({ sql }) => sql.includes("FROM booking_notes"));
  assert.match(notesQuery.sql, /visibility = 'customer_visible'/);
});
