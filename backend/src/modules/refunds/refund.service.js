const { pool, withTransaction } = require('../../config/db');

function problem(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

async function refreshPaymentAndBooking(conn, paymentId, bookingId) {
  const [[payment]] = await conn.execute(
    'SELECT amount, status FROM payments WHERE id = ? FOR UPDATE', [paymentId]
  );
  const [[totals]] = await conn.execute(
    `SELECT COALESCE(SUM(CASE WHEN status IN ('requested','pending','succeeded') THEN amount ELSE 0 END), 0) AS committed,
            COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) AS succeeded
       FROM refunds WHERE payment_id = ?`, [paymentId]
  );
  const paid = Number(payment.amount);
  const committed = Number(totals.committed);
  const refunded = Number(totals.succeeded);
  if (committed - paid > 0.0001) throw problem(409, 'Committed refunds exceed the original payment amount.');

  if (payment.status === 'succeeded') {
    if (refunded >= paid - 0.005) {
      await conn.execute("UPDATE bookings SET payment_status = 'refunded' WHERE id = ?", [bookingId]);
    } else if (refunded > 0) {
      await conn.execute("UPDATE bookings SET payment_status = 'partially_refunded' WHERE id = ?", [bookingId]);
    } else {
      await conn.execute("UPDATE bookings SET payment_status = 'paid' WHERE id = ?", [bookingId]);
    }
  }
  return { original_amount: money(paid), committed_refund_amount: money(committed), refunded_amount: money(refunded), refundable_amount: money(Math.max(0, paid - committed)) };
}

async function createRefund(adminId, paymentId, amount, reason) {
  const requested = money(amount);
  if (!requested || Number(requested) <= 0) throw problem(400, 'Refund amount must be greater than zero.');
  if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) throw problem(400, 'Reason must be 500 characters or fewer.');

  return withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT p.id, p.booking_id, p.amount, p.currency_code, p.status
         FROM payments p WHERE p.id = ? FOR UPDATE`, [paymentId]
    );
    if (!rows.length) throw problem(404, 'Payment not found.');
    const payment = rows[0];
    if (payment.status !== 'succeeded') throw problem(409, 'Only successfully verified payments can be refunded.');
    const [existing] = await conn.execute(
      `SELECT COALESCE(SUM(amount), 0) AS committed
         FROM refunds WHERE payment_id = ? AND status IN ('requested','pending','succeeded')`, [paymentId]
    );
    const remaining = Number(payment.amount) - Number(existing[0].committed);
    if (Number(requested) > remaining + 0.0001) throw problem(409, `Refund exceeds the remaining refundable amount (${money(Math.max(0, remaining))} ${payment.currency_code}).`);
    const [insert] = await conn.execute(
      `INSERT INTO refunds (payment_id, amount, reason, status, requested_by)
       VALUES (?, ?, ?, 'requested', ?)`, [paymentId, requested, reason || null, adminId]
    );
    const balance = await refreshPaymentAndBooking(conn, paymentId, payment.booking_id);
    return { id: insert.insertId, payment_id: paymentId, amount: requested, currency_code: payment.currency_code, status: 'requested', ...balance };
  });
}

async function updateRefund(adminId, refundId, status, providerRefundId) {
  const allowed = ['pending', 'succeeded', 'failed', 'cancelled'];
  if (!allowed.includes(status)) throw problem(400, `Status must be one of: ${allowed.join(', ')}.`);
  if (providerRefundId !== undefined && (typeof providerRefundId !== 'string' || providerRefundId.length > 190)) throw problem(400, 'provider_refund_id must be 190 characters or fewer.');

  return withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT r.*, p.booking_id, p.currency_code, p.amount AS payment_amount, p.status AS payment_status
         FROM refunds r JOIN payments p ON p.id = r.payment_id
        WHERE r.id = ? FOR UPDATE`, [refundId]
    );
    if (!rows.length) throw problem(404, 'Refund not found.');
    const refund = rows[0];
    if (['succeeded', 'failed', 'cancelled'].includes(refund.status)) {
      if (refund.status === status && (!providerRefundId || providerRefundId === refund.provider_refund_id)) return refund;
      throw problem(409, 'A completed refund record cannot be changed. Create a new refund if another refund is required.');
    }
    if (status === 'succeeded' && refund.payment_status !== 'succeeded') throw problem(409, 'The original payment is not in a refundable state.');

    await conn.execute(
      `UPDATE refunds SET status = ?, provider_refund_id = COALESCE(?, provider_refund_id),
              processed_by = ?, processed_at = CASE WHEN ? IN ('succeeded','failed','cancelled') THEN UTC_TIMESTAMP() ELSE processed_at END
        WHERE id = ?`, [status, providerRefundId || null, adminId, status, refundId]
    );
    const balance = await refreshPaymentAndBooking(conn, refund.payment_id, refund.booking_id);
    return { id: refundId, payment_id: refund.payment_id, amount: refund.amount, currency_code: refund.currency_code, status, provider_refund_id: providerRefundId || refund.provider_refund_id, ...balance };
  });
}

async function listRefunds({ page = 1, limit = 20, status, paymentId } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const where = [];
  const params = [];
  if (status) { where.push('r.status = ?'); params.push(status); }
  if (paymentId) { where.push('r.payment_id = ?'); params.push(paymentId); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM refunds r ${clause}`, params);
  const [rows] = await pool.execute(
    `SELECT r.id, r.payment_id, r.amount, r.reason, r.status, r.provider_refund_id,
            r.requested_by, r.processed_by, r.processed_at, r.created_at,
            p.booking_id, p.provider, p.provider_payment_id, p.currency_code,
            b.booking_reference, b.customer_name, b.customer_email
       FROM refunds r JOIN payments p ON p.id = r.payment_id
       JOIN bookings b ON b.id = p.booking_id ${clause}
      ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [...params, l, (p - 1) * l]
  );
  return { items: rows, pagination: { page: p, limit: l, total: Number(count.total), pages: Math.ceil(Number(count.total) / l) } };
}

async function listCustomerRefunds(userId, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const [rows] = await pool.execute(
    `SELECT r.id, r.payment_id, r.amount, r.reason, r.status, r.provider_refund_id, r.processed_at, r.created_at,
            p.currency_code, p.provider, p.provider_payment_id, b.booking_reference
       FROM refunds r JOIN payments p ON p.id = r.payment_id
       JOIN bookings b ON b.id = p.booking_id
      WHERE b.user_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [userId, l, (p - 1) * l]
  );
  return { items: rows, pagination: { page: p, limit: l, returned: rows.length } };
}

module.exports = { createRefund, updateRefund, listRefunds, listCustomerRefunds };
