const { test } = require("node:test");
const assert = require("node:assert/strict");
const dashboardService = require("../../src/modules/dashboard/dashboard.service");
const { query } = require("../../src/modules/dashboard/dashboard.schema");

test("dashboard query accepts a bounded month window", () => {
  assert.deepEqual(query.parse({}), { months: 12 });
  assert.deepEqual(query.parse({ months: "6" }), { months: 6 });
  assert.throws(() => query.parse({ months: "25" }));
  assert.throws(() => query.parse({ months: "0" }));
});

test("dashboard analytics fills empty months and keeps revenue currencies separate", () => {
  const raw = {
    summary: {
      total_bookings: "17",
      pending_bookings: "3",
      active_customers: "12",
      published_tours: "4",
      upcoming_departures: "2",
    },
    bookingStatuses: [{ status: "confirmed", count: "8" }],
    bookingTrend: [{ month: "2026-01", bookings: "2" }],
    revenueTrend: [
      { month: "2026-01", currency_code: "USD", amount: "140.00" },
      { month: "2026-01", currency_code: "BDT", amount: "8000.00" },
    ],
    revenueByCurrency: [{ currency_code: "USD", amount: "540.00" }],
    topTours: [{ tour_id: "7", title: "Sundarbans Tour", bookings: "4", travelers: "9" }],
    recentBookings: [{ id: "9", booking_reference: "BB-123" }],
    upcomingDepartures: [{
      id: "5",
      tour_id: "7",
      tour_title: "Sundarbans Tour",
      starts_at: "2026-02-10T00:00:00.000Z",
      seat_capacity: "20",
      seats_reserved: "12",
      status: "scheduled",
    }],
  };

  const result = dashboardService.buildDashboard(raw, 3, new Date("2026-03-15T12:00:00Z"));

  assert.deepEqual(result.bookingTrend, [
    { month: "2026-01", bookings: 2 },
    { month: "2026-02", bookings: 0 },
    { month: "2026-03", bookings: 0 },
  ]);
  assert.deepEqual(result.revenueTrend[0], {
    month: "2026-01",
    byCurrency: [
      { currencyCode: "USD", amount: "140.00" },
      { currencyCode: "BDT", amount: "8000.00" },
    ],
  });
  assert.equal(result.summary.totalBookings, 17);
  assert.equal(result.topTours[0].travelers, 9);
  assert.deepEqual(result.period, { months: 3, from: "2026-01", to: "2026-03" });
});
