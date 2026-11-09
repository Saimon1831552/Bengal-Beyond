const crypto = require('crypto');
const { pool, withTransaction } = require('../../config/db');
const env = require('../../config/env');

const API_BASE = env.SSLCOMMERZ_SANDBOX
  ? 'https://sandbox.sslcommerz.com'
  : 'https://securepay.sslcommerz.com';

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

function requiredConfig() {
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD ||
      !env.SSLCOMMERZ_IPN_URL ||
      !env.SSLCOMMERZ_SUCCESS_URL || !env.SSLCOMMERZ_FAIL_URL ||
      !env.SSLCOMMERZ_CANCEL_URL || !env.FRONTEND_URL) {
    throw problem(503, 'SSLCommerz is not fully configured on the server.');
  }
}

async function postForm(url, values) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) body.set(key, String(value));
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw problem(502, `SSLCommerz API returned HTTP ${response.status}.`);
  return response.json();
}

async function initiate(userId, bookingId, idempotencyKey) {
  requiredConfig();
  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim() || idempotencyKey.trim().length > 100) {
    throw problem(400, 'Provide an idempotency_key of 1–100 characters.');
  }

  const attempt = await withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE', [bookingId, userId]
    );
    if (!rows.length) throw problem(404, 'Booking not found.');
    const booking = rows[0];

    const [existingKey] = await conn.execute(
      'SELECT id, booking_id, provider, provider_payment_id, status, raw_event FROM payments WHERE idempotency_key = ? LIMIT 1',
      [idempotencyKey.trim()]
    );
    if (existingKey.length) {
      const old = existingKey[0];
      if (Number(old.booking_id) !== Number(bookingId) || old.provider !== 'sslcommerz') {
        throw problem(409, 'This idempotency key is already used by another payment.');
      }
      const meta = old.raw_event ? JSON.parse(old.raw_event) : {};
      if (meta.gatewayPageURL) return { reused: true, paymentId: old.id, gatewayPageURL: meta.gatewayPageURL };
      if (old.status === 'succeeded') throw problem(409, 'This booking payment is already completed.');
      throw problem(409, 'This payment attempt already exists but has no reusable checkout URL. Check payment history or contact support.');
    }

    if (!['pending_review', 'awaiting_payment'].includes(booking.booking_status)) {
      throw problem(409, 'This booking is not eligible for payment.');
    }
    if (['paid', 'not_required', 'partially_refunded', 'refunded'].includes(booking.payment_status)) {
      throw problem(409, 'This booking does not currently require another payment.');
    }
    if (booking.currency_code !== 'BDT') throw problem(409, 'SSLCommerz checkout is configured for BDT bookings only.');
    const amount = money(booking.total_amount);
    if (!amount || Number(amount) < 10 || Number(amount) > 500000) {
      throw problem(409, 'SSLCommerz transaction amount must be between BDT 10.00 and BDT 500,000.00.');
    }

    const [open] = await conn.execute(
      "SELECT id FROM payments WHERE booking_id = ? AND provider = 'sslcommerz' AND status IN ('initiated','pending') LIMIT 1 FOR UPDATE",
      [bookingId]
    );
    if (open.length) throw problem(409, 'An SSLCommerz payment attempt is already open for this booking. Reuse its original request key.');

    const tranId = `BB${Date.now()}${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const [insert] = await conn.execute(
      `INSERT INTO payments (booking_id, provider, provider_payment_id, idempotency_key, amount, currency_code, status)
       VALUES (?, 'sslcommerz', ?, ?, ?, 'BDT', 'initiated')`,
      [bookingId, tranId, idempotencyKey.trim(), amount]
    );
    await conn.execute("UPDATE bookings SET payment_status = 'pending' WHERE id = ?", [bookingId]);
    return { paymentId: insert.insertId, tranId, amount, booking };
  });

  if (attempt.reused) return attempt;

  try {
    const b = attempt.booking;
    const result = await postForm(`${API_BASE}/gwprocess/v4/api.php`, {
      store_id: env.SSLCOMMERZ_STORE_ID,
      store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
      total_amount: attempt.amount,
      currency: 'BDT',
      tran_id: attempt.tranId,
      success_url: env.SSLCOMMERZ_SUCCESS_URL,
      fail_url: env.SSLCOMMERZ_FAIL_URL,
      cancel_url: env.SSLCOMMERZ_CANCEL_URL,
      ipn_url: env.SSLCOMMERZ_IPN_URL,
      cus_name: b.customer_name,
      cus_email: b.customer_email,
      cus_phone: b.customer_phone,
      cus_add1: 'Bangladesh',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: `Bengal Beyond booking ${b.booking_reference}`,
      product_category: 'Tour',
      product_profile: 'general',
      value_a: String(attempt.paymentId),
      value_b: String(b.id),
    });
    const checkoutUrl = result.GatewayPageURL || result.redirectGatewayURL;
    if (result.status !== 'SUCCESS' || !checkoutUrl || !/^https:\/\//i.test(checkoutUrl)) {
      throw problem(502, result.failedreason || 'SSLCommerz did not return a valid checkout URL.');
    }
    await pool.execute(
      'UPDATE payments SET status = ?, raw_event = ? WHERE id = ?',
      ['pending', JSON.stringify({ sessionkey: result.sessionkey, gatewayPageURL: checkoutUrl, sessionResponse: result }), attempt.paymentId]
    );
    return { payment_id: attempt.paymentId, tran_id: attempt.tranId, status: 'pending', gateway_url: checkoutUrl };
  } catch (error) {
    await pool.execute(
      "UPDATE payments SET status = 'failed', raw_event = ? WHERE id = ? AND status <> 'succeeded'",
      [JSON.stringify({ initiation_error: error.message }), attempt.paymentId]
    );
    await pool.execute(
      "UPDATE bookings SET payment_status = CASE WHEN EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = bookings.id AND p.status = 'succeeded') THEN 'paid' ELSE 'failed' END WHERE id = ?",
      [bookingId]
    );
    throw error;
  }
}

async function validateAndApply(payload) {
  requiredConfig();
  const valId = String(payload.val_id || '').trim();
  if (!valId || valId.length > 100) throw problem(400, 'Missing SSLCommerz validation ID.');
  const url = new URL(`${API_BASE}/validator/api/validationserverAPI.php`);
  url.searchParams.set('val_id', valId);
  url.searchParams.set('store_id', env.SSLCOMMERZ_STORE_ID);
  url.searchParams.set('store_passwd', env.SSLCOMMERZ_STORE_PASSWORD);
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw problem(502, 'Could not validate transaction with SSLCommerz.');
  const verified = await response.json();

  const gatewayStatus = String(verified.status || '').toUpperCase();
  if (!['VALID', 'VALIDATED', 'FAILED', 'CANCELLED'].includes(gatewayStatus)) {
    return { verified: false, gateway_status: verified.status || 'UNKNOWN' };
  }
  if (String(verified.currency || '').toUpperCase() !== 'BDT') throw problem(400, 'Validated transaction currency does not match.');

  return withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT p.*, b.booking_status FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.provider = \'sslcommerz\' AND p.provider_payment_id = ? FOR UPDATE',
      [String(verified.tran_id || '')]
    );
    if (!rows.length) throw problem(404, 'No local payment matches this SSLCommerz transaction.');
    const payment = rows[0];
    if (money(verified.amount) !== money(payment.amount) || String(verified.currency || '').toUpperCase() !== payment.currency_code) {
      throw problem(409, 'Validated amount or currency does not match the local payment.');
    }
    if (gatewayStatus === 'FAILED' || gatewayStatus === 'CANCELLED') {
      if (payment.status !== 'succeeded') {
        await conn.execute('UPDATE payments SET status = ?, raw_event = ? WHERE id = ?',
          [gatewayStatus === 'FAILED' ? 'failed' : 'cancelled', JSON.stringify({ validation: verified }), payment.id]);
        await conn.execute(
          "UPDATE bookings SET payment_status = CASE WHEN EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = bookings.id AND p.status = 'succeeded') THEN 'paid' ELSE ? END WHERE id = ?",
          [gatewayStatus === 'FAILED' ? 'failed' : 'unpaid', payment.booking_id]
        );
      }
      return { verified: true, payment_id: payment.id, gateway_status: gatewayStatus };
    }
    if (gatewayStatus === 'VALID' && String(verified.risk_level || '0') === '1') {
      await conn.execute(
        "UPDATE payments SET status = 'pending', raw_event = ? WHERE id = ?",
        [JSON.stringify({ validation: verified, risk_hold: true }), payment.id]
      );
      return { verified: true, risk_hold: true, payment_id: payment.id };
    }
    if (String(verified.status).toUpperCase() === 'VALID' || String(verified.status).toUpperCase() === 'VALIDATED') {
      await conn.execute(
        "UPDATE payments SET status = 'succeeded', verified_at = UTC_TIMESTAMP(), raw_event = ? WHERE id = ?",
        [JSON.stringify({ validation: verified }), payment.id]
      );
      await conn.execute("UPDATE bookings SET payment_status = 'paid' WHERE id = ?", [payment.booking_id]);
      // A payment must not bypass the operator's pending-review decision.
      if (payment.booking_status === 'awaiting_payment') {
        await conn.execute("UPDATE bookings SET booking_status = 'confirmed', confirmed_at = UTC_TIMESTAMP() WHERE id = ?", [payment.booking_id]);
      }
      return { verified: true, payment_id: payment.id, booking_id: payment.booking_id, payment_status: 'paid' };
    }
    return { verified: false, gateway_status: verified.status };
  });
}

async function getOwnedPayment(userId, paymentId) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.booking_id, b.booking_reference, p.provider, p.provider_payment_id,
            p.amount, p.currency_code, p.status, p.verified_at, p.created_at
       FROM payments p JOIN bookings b ON b.id = p.booking_id
      WHERE p.id = ? AND b.user_id = ?`, [paymentId, userId]
  );
  if (!rows.length) throw problem(404, 'Payment not found.');
  return rows[0];
}

module.exports = { initiate, validateAndApply, getOwnedPayment };
