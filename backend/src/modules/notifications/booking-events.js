const env = require("../../config/env");
const logger = require("../../utils/logger");
const { enqueue } = require("./notification.queue");

const baseUrl = () => env.FRONTEND_URL.split(",")[0].trim().replace(/\/+$/, "");
const fmtMoney = (amount, cur) =>
  `${cur} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) =>
  d ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(d)) : "";

/**
 * Queue one email about a booking. Call it with the SAME connection as the surrounding
 * transaction. It never throws: a failed email must not roll back a booking or payment.
 * The idempotency key makes retries and duplicate gateway callbacks harmless.
 */
async function queueBookingEmail(conn, bookingId, templateKey, extra = {}, keySuffix = "") {
  try {
    const [[b]] = await conn.execute(
      `SELECT id, user_id, booking_reference, customer_name, customer_email, currency_code, total_amount
         FROM bookings WHERE id = ?`, [bookingId]);
    if (!b) return;
    const [[it]] = await conn.execute(
      `SELECT bi.quantity, bi.tour_snapshot, td.starts_at
         FROM booking_items bi LEFT JOIN tour_departures td ON td.id = bi.departure_id
        WHERE bi.booking_id = ? ORDER BY bi.id LIMIT 1`, [bookingId]);

    let title = "";
    try {
      const snap = typeof it?.tour_snapshot === "string" ? JSON.parse(it.tour_snapshot) : it?.tour_snapshot;
      title = snap?.title || "";
    } catch { /* snapshot is informational only */ }

    const extras = { ...extra };
    for (const k of ["amount", "refund_amount"]) {
      if (extras[k] != null) extras[k] = fmtMoney(extras[k], b.currency_code);
    }
    const member = Boolean(b.user_id);
    const url = `${baseUrl()}/bookings/${b.id}`;
    const viewLine = member
      ? `View your booking: ${url}`
      : `Questions? Contact us: ${baseUrl()}/contact`;
    const nextStep = member
      ? `Please complete your payment within ${extras.hold_minutes || 15} minutes to keep your seats: ${url}`
      : "Our team will review your booking and contact you by email or phone to arrange payment.";
    const payload = {
      name: b.customer_name,
      booking_reference: b.booking_reference,
      tour_title: title,
      departure_date: fmtDate(it?.starts_at),
      travellers: String(it?.quantity ?? ""),
      total: fmtMoney(b.total_amount, b.currency_code),
      booking_url: url,
      view_line: viewLine,
      next_step: nextStep,
      ...extras,
    };
    await enqueue({
      userId: b.user_id,
      channel: "email",
      recipient: b.customer_email,
      templateKey,
      payload,
      idempotencyKey: `${templateKey}:${b.id}${keySuffix}`,
      conn,
    });
  } catch (error) {
    logger.error("Could not queue booking email", { templateKey, bookingId, error: error.message });
  }
}

module.exports = { queueBookingEmail };