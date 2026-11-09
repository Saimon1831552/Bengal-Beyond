const { pool } = require("../../config/db");

async function getDashboardData({ startDate, endDate }) {
  const [
    [summaryRows],
    [statusRows],
    [bookingTrendRows],
    [revenueRows],
    [allTimeRevenueRows],
    [topTourRows],
    [recentBookingRows],
    [departureRows],
  ] = await Promise.all([
    pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM bookings) AS total_bookings,
         (SELECT COUNT(*) FROM bookings WHERE booking_status IN ('pending_review', 'awaiting_payment')) AS pending_bookings,
         (SELECT COUNT(*) FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
          WHERE r.role_key = 'customer' AND u.account_status = 'active') AS active_customers,
         (SELECT COUNT(*) FROM tours WHERE status = 'published' AND deleted_at IS NULL) AS published_tours,
         (SELECT COUNT(*) FROM tour_departures
          WHERE status = 'scheduled' AND starts_at >= UTC_TIMESTAMP()) AS upcoming_departures`,
    ),
    pool.execute(
      `SELECT booking_status AS status, COUNT(*) AS count
         FROM bookings
        GROUP BY booking_status
        ORDER BY booking_status`,
    ),
    pool.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS bookings
         FROM bookings
        WHERE created_at >= :startDate AND created_at < :endDate
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month`,
      { startDate, endDate },
    ),
    pool.execute(
      `SELECT DATE_FORMAT(COALESCE(verified_at, created_at), '%Y-%m') AS month,
              currency_code, SUM(amount) AS amount
         FROM payments
        WHERE status = 'succeeded'
          AND COALESCE(verified_at, created_at) >= :startDate
          AND COALESCE(verified_at, created_at) < :endDate
        GROUP BY DATE_FORMAT(COALESCE(verified_at, created_at), '%Y-%m'), currency_code
        ORDER BY month, currency_code`,
      { startDate, endDate },
    ),
    pool.execute(
      `SELECT currency_code, SUM(amount) AS amount
         FROM payments
        WHERE status = 'succeeded'
        GROUP BY currency_code
        ORDER BY currency_code`,
    ),
    pool.execute(
      `SELECT t.id AS tour_id, t.title, COUNT(DISTINCT b.id) AS bookings,
              COALESCE(SUM(bi.quantity), 0) AS travelers
         FROM booking_items bi
         JOIN bookings b ON b.id = bi.booking_id
         JOIN tours t ON t.id = bi.tour_id
        WHERE b.created_at >= :startDate AND b.created_at < :endDate
          AND b.booking_status NOT IN ('rejected', 'cancelled', 'expired')
        GROUP BY t.id, t.title
        ORDER BY bookings DESC, travelers DESC, t.id
        LIMIT 5`,
      { startDate, endDate },
    ),
    pool.execute(
      `SELECT id, booking_reference, booking_status, payment_status,
              customer_name, currency_code, total_amount, created_at
         FROM bookings
        ORDER BY created_at DESC, id DESC
        LIMIT 8`,
    ),
    pool.execute(
      `SELECT td.id, td.starts_at, td.seat_capacity, td.seats_reserved,
              td.status, t.id AS tour_id, t.title AS tour_title
         FROM tour_departures td
         JOIN tours t ON t.id = td.tour_id
        WHERE td.status = 'scheduled' AND td.starts_at >= UTC_TIMESTAMP()
        ORDER BY td.starts_at, td.id
        LIMIT 5`,
    ),
  ]);

  return {
    summary: summaryRows[0],
    bookingStatuses: statusRows,
    bookingTrend: bookingTrendRows,
    revenueTrend: revenueRows,
    revenueByCurrency: allTimeRevenueRows,
    topTours: topTourRows,
    recentBookings: recentBookingRows,
    upcomingDepartures: departureRows,
  };
}

module.exports = { getDashboardData };
