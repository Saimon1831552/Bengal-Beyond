const express = require("express");
const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();
router.use(authenticate);

/* ============================================================================
 * 1. UNIFIED TRANSACTIONS LEDGER  (/api/admin/transactions)
 * Combines `payments` (+) and `refunds` (-) into a single filterable ledger
 * ========================================================================== */
router.get(
  "/transactions",
  authorize("payments.read"),
  asyncHandler(async (req, res) => {
    const type = req.query.type || ""; // 'payment' | 'refund' | ''
    const status = req.query.status || "";
    const q = (req.query.q || "").trim();

    const parts = [];
    const params = [];

    if (!type || type === "payment") {
      const pWhere = ["1=1"];
      if (status) { pWhere.push("p.status = ?"); params.push(status); }
      if (q) {
        pWhere.push("(b.booking_reference LIKE ? OR b.customer_name LIKE ? OR p.provider_payment_id LIKE ?)");
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
      parts.push(`
        SELECT 'payment' AS entry_type,
               p.id AS entry_id,
               p.booking_id,
               b.booking_reference,
               b.customer_name,
               b.customer_email,
               p.provider,
               p.provider_payment_id AS reference_id,
               p.amount,
               p.currency_code,
               p.status,
               COALESCE(p.verified_at, p.created_at) AS occurred_at
          FROM payments p
          JOIN bookings b ON b.id = p.booking_id
         WHERE ${pWhere.join(" AND ")}
      `);
    }

    if (!type || type === "refund") {
      const rWhere = ["1=1"];
      if (status) { rWhere.push("r.status = ?"); params.push(status); }
      if (q) {
        rWhere.push("(b.booking_reference LIKE ? OR b.customer_name LIKE ? OR r.provider_refund_id LIKE ?)");
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
      parts.push(`
        SELECT 'refund' AS entry_type,
               r.id AS entry_id,
               p.booking_id,
               b.booking_reference,
               b.customer_name,
               b.customer_email,
               p.provider,
               r.provider_refund_id AS reference_id,
               r.amount,
               p.currency_code,
               r.status,
               COALESCE(r.processed_at, r.created_at) AS occurred_at
          FROM refunds r
          JOIN payments p ON p.id = r.payment_id
          JOIN bookings b ON b.id = p.booking_id
         WHERE ${rWhere.join(" AND ")}
      `);
    }

    const sql = `${parts.join(" UNION ALL ")} ORDER BY occurred_at DESC LIMIT 200`;
    const [rows] = await pool.execute(sql, params);
    return sendSuccess(res, rows);
  })
);

/* ============================================================================
 * 2. REVENUE & ANALYTICS REPORTS  (/api/admin/reports)
 * ========================================================================== */
router.get(
  "/reports",
  authorize("payments.read"),
  asyncHandler(async (req, res) => {
    const from = req.query.from || null;
    const to = req.query.to || null;

    const pWhere = ["p.status = 'succeeded'"];
    const pParams = [];
    if (from) { pWhere.push("DATE(COALESCE(p.verified_at, p.created_at)) >= ?"); pParams.push(from); }
    if (to) { pWhere.push("DATE(COALESCE(p.verified_at, p.created_at)) <= ?"); pParams.push(to); }

    const [[grossRow]] = await pool.execute(
      `SELECT COALESCE(SUM(p.amount), 0) AS gross_revenue,
              COUNT(*) AS payment_count
         FROM payments p
        WHERE ${pWhere.join(" AND ")}`,
      pParams
    );

    const rWhere = ["r.status = 'succeeded'"];
    const rParams = [];
    if (from) { rWhere.push("DATE(COALESCE(r.processed_at, r.created_at)) >= ?"); rParams.push(from); }
    if (to) { rWhere.push("DATE(COALESCE(r.processed_at, r.created_at)) <= ?"); rParams.push(to); }

    const [[refundRow]] = await pool.execute(
      `SELECT COALESCE(SUM(r.amount), 0) AS total_refunds,
              COUNT(*) AS refund_count
         FROM refunds r
        WHERE ${rWhere.join(" AND ")}`,
      rParams
    );

    const [[bookingStats]] = await pool.execute(
      `SELECT COUNT(*) AS total_bookings,
              SUM(CASE WHEN booking_status IN ('confirmed', 'completed') THEN 1 ELSE 0 END) AS confirmed_bookings,
              SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
              COALESCE(AVG(CASE WHEN booking_status IN ('confirmed', 'completed') THEN total_amount END), 0) AS avg_order_value
         FROM bookings`
    );

    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(COALESCE(p.verified_at, p.created_at), '%Y-%m') AS month,
              COALESCE(SUM(p.amount), 0) AS revenue,
              COUNT(*) AS transactions
         FROM payments p
        WHERE p.status = 'succeeded'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12`
    );

    const [byTour] = await pool.execute(
      `SELECT t.id AS tour_id,
              t.title AS tour_title,
              COUNT(DISTINCT b.id) AS bookings_count,
              COALESCE(SUM(bi.quantity), 0) AS travelers_count,
              COALESCE(SUM(bi.line_total), 0) AS booked_value
         FROM tours t
         LEFT JOIN booking_items bi ON bi.tour_id = t.id
         LEFT JOIN bookings b ON b.id = bi.booking_id AND b.booking_status NOT IN ('cancelled', 'rejected', 'expired')
        WHERE t.deleted_at IS NULL
        GROUP BY t.id
        ORDER BY booked_value DESC
        LIMIT 15`
    );

    const gross = Number(grossRow.gross_revenue || 0);
    const refunds = Number(refundRow.total_refunds || 0);

    return sendSuccess(res, {
      kpis: {
        gross_revenue: gross,
        total_refunds: refunds,
        net_revenue: gross - refunds,
        payment_count: Number(grossRow.payment_count || 0),
        refund_count: Number(refundRow.refund_count || 0),
        total_bookings: Number(bookingStats.total_bookings || 0),
        confirmed_bookings: Number(bookingStats.confirmed_bookings || 0),
        cancelled_bookings: Number(bookingStats.cancelled_bookings || 0),
        avg_order_value: Number(bookingStats.avg_order_value || 0),
      },
      monthly: monthly.reverse(),
      byTour,
    });
  })
);

/* ============================================================================
 * 3. INVOICES  (/api/admin/invoices)
 * ========================================================================== */
router.get(
  "/invoices",
  authorize("payments.read"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT i.*, b.booking_reference, b.booking_status, b.payment_status
         FROM invoices i
         JOIN bookings b ON b.id = i.booking_id
        ORDER BY i.issued_at DESC, i.id DESC`
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/invoices",
  authorize("payments.manage"),
  asyncHandler(async (req, res) => {
    const { booking_id, due_at = null, notes = null, status = "issued" } = req.body;
    if (!booking_id) {
      throw AppError.badRequest("booking_id is required.", "VALIDATION_ERROR");
    }

    const [[booking]] = await pool.execute(
      `SELECT id, booking_reference, customer_name, customer_email, currency_code,
              subtotal, discount_amount, tax_amount, total_amount, payment_status
         FROM bookings
        WHERE id = ?
        LIMIT 1`,
      [Number(booking_id)]
    );
    if (!booking) throw AppError.notFound("Booking not found.");

    const year = new Date().getFullYear();
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const invoiceNumber = `INV-${year}-${booking.id}-${rand}`;
    const resolvedStatus = booking.payment_status === "paid" ? "paid" : status;

    const [result] = await pool.execute(
      `INSERT INTO invoices (
         invoice_number, booking_id, customer_name, customer_email,
         currency_code, subtotal, discount_amount, tax_amount, total_amount,
         status, due_at, notes, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        booking.id,
        booking.customer_name,
        booking.customer_email,
        booking.currency_code || "BDT",
        booking.subtotal,
        booking.discount_amount,
        booking.tax_amount,
        booking.total_amount,
        resolvedStatus,
        due_at || null,
        notes || null,
        req.auth.userId,
      ]
    );

    const [[created]] = await pool.execute(
      `SELECT i.*, b.booking_reference, b.booking_status, b.payment_status
         FROM invoices i
         JOIN bookings b ON b.id = i.booking_id
        WHERE i.id = ?`,
      [result.insertId]
    );
    return sendSuccess(res, created, { status: 201 });
  })
);

router.patch(
  "/invoices/:id",
  authorize("payments.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status, notes } = req.body;
    const fields = [];
    const params = [];

    if (status !== undefined) {
      if (!["draft", "issued", "paid", "void"].includes(status)) {
        throw AppError.badRequest("Invalid invoice status.", "VALIDATION_ERROR");
      }
      fields.push("status = ?");
      params.push(status);
    }
    if (notes !== undefined) {
      fields.push("notes = ?");
      params.push(notes || null);
    }
    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE invoices SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Invoice not found.");
    return sendSuccess(res, { updated: true });
  })
);

/* ============================================================================
 * 4. PAYMENT WEBHOOK EVENTS  (/api/admin/payment-webhooks)
 * Reads & retries rows in existing `payment_webhook_events` table
 * ========================================================================== */
router.get(
  "/payment-webhooks",
  authorize("payments.read"),
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.status) {
      where.push("processing_status = ?");
      params.push(req.query.status);
    }
    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `SELECT id, provider, event_key, validation_id, processing_status,
              attempt_count, last_error, received_at, last_attempt_at, processed_at,
              payload_json, result_json
         FROM payment_webhook_events
        ${sqlWhere}
        ORDER BY received_at DESC, id DESC
        LIMIT 100`,
      params
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/payment-webhooks/:id/retry",
  authorize("payments.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [result] = await pool.execute(
      `UPDATE payment_webhook_events
          SET processing_status = 'received',
              next_retry_at = NOW(),
              last_error = NULL
        WHERE id = ?`,
      [id]
    );
    if (!result.affectedRows) throw AppError.notFound("Webhook event not found.");
    return sendSuccess(res, { requeued: true });
  })
);

module.exports = router;