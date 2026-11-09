const repository = require("./dashboard.repository");

function toNumber(value) {
  return Number(value || 0);
}

function getPeriod(months, now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months, 1));
  return { start, end };
}

function formatMonth(date) {
  return date.toISOString().slice(0, 7);
}

function buildDashboard(raw, months, now = new Date()) {
  const { start, end } = getPeriod(months, now);
  const bookingCounts = new Map(raw.bookingTrend.map((row) => [row.month, toNumber(row.bookings)]));
  const monthlyRevenue = new Map();

  for (const row of raw.revenueTrend) {
    if (!monthlyRevenue.has(row.month)) monthlyRevenue.set(row.month, []);
    monthlyRevenue.get(row.month).push({
      currencyCode: row.currency_code,
      amount: String(row.amount),
    });
  }

  const bookingTrend = [];
  const revenueTrend = [];
  for (let month = new Date(start); month < end; month.setUTCMonth(month.getUTCMonth() + 1)) {
    const key = formatMonth(month);
    bookingTrend.push({ month: key, bookings: bookingCounts.get(key) || 0 });
    revenueTrend.push({ month: key, byCurrency: monthlyRevenue.get(key) || [] });
  }

  return {
    period: { months, from: formatMonth(start), to: formatMonth(new Date(end.getTime() - 1)) },
    summary: {
      totalBookings: toNumber(raw.summary.total_bookings),
      pendingBookings: toNumber(raw.summary.pending_bookings),
      activeCustomers: toNumber(raw.summary.active_customers),
      publishedTours: toNumber(raw.summary.published_tours),
      upcomingDepartures: toNumber(raw.summary.upcoming_departures),
    },
    revenueByCurrency: raw.revenueByCurrency.map((row) => ({
      currencyCode: row.currency_code,
      amount: String(row.amount),
    })),
    bookingStatuses: raw.bookingStatuses.map((row) => ({
      status: row.status,
      count: toNumber(row.count),
    })),
    bookingTrend,
    revenueTrend,
    topTours: raw.topTours.map((row) => ({
      tourId: row.tour_id,
      title: row.title,
      bookings: toNumber(row.bookings),
      travelers: toNumber(row.travelers),
    })),
    recentBookings: raw.recentBookings,
    upcomingDepartures: raw.upcomingDepartures.map((row) => ({
      id: row.id,
      tourId: row.tour_id,
      tourTitle: row.tour_title,
      startsAt: row.starts_at,
      seatCapacity: toNumber(row.seat_capacity),
      seatsReserved: toNumber(row.seats_reserved),
      status: row.status,
    })),
  };
}

async function getDashboard(months) {
  const now = new Date();
  const { start, end } = getPeriod(months, now);
  const raw = await repository.getDashboardData({
    startDate: start.toISOString().slice(0, 19).replace("T", " "),
    endDate: end.toISOString().slice(0, 19).replace("T", " "),
  });
  return buildDashboard(raw, months, now);
}

module.exports = { getDashboard, buildDashboard, getPeriod };
