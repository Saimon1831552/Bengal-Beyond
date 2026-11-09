const crypto = require('crypto');
const { pool, withTransaction } = require('../../config/db');
const env = require('../../config/env');

const API_BASE = env.SSLCOMMERZ_SANDBOX === false
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';
const REFUND_ENDPOINT = `${API_BASE}/validator/api/merchantTransIDvalidationAPI.php`;

function problem(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}
function config() {
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw problem(503, 'SSLCommerz store credentials are not configured.');
  }
}
async function gatewayGet(params) {
  config();
  const url = new URL(REFUND_ENDPOINT);
  for (const [key, value] of Object.entries({
    ...params,
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    format: 'json'
  })) url.searchParams.set(key, String(value));
  const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw problem(502, `SSLCommerz refund API returned HTTP ${response.status}.`);
  const data = await response.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw problem(502, 'SSLCommerz returned an invalid refund response.');
  }
  return data;
}

/**
 * A refund is reserved in the local ledger before the network call. Once an
 * initiation request may have reached SSLCommerz, it is NEVER blindly resent.
 * Operators must query its status using the returned refund_ref_id.
 */
async function initiate(adminId, refundId) {
  const prepared = await withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT r.*, p.provider, p.provider_payment_id, p.raw_event,
              p.currency_code, p.status AS payment_status
         FROM refunds r JOIN payments p ON p.id = r.payment_id
        WHERE r.id = ? FOR UPDATE`, [refundId]
    );
    if (!rows.length) throw problem(404, 'Refund not found.');
    const r = rows[0];
    if (r.provider !== 'sslcommerz') throw problem(409, 'This refund is not associated with SSLCommerz.');
    if (r.status !== 'requested') {
      if (r.status === 'pending' && r.provider_refund_trans_id) {
        return { reused: true, id: r.id, status: r.status, refund_trans_id: r.provider_refund_trans_id,
          refund_ref_id: r.provider_refund_id };
      }
      throw problem(409, 'Only a new requested refund can be submitted to SSLCommerz.');
    }
    if (r.payment_status !== 'succeeded') throw problem(409, 'The original payment is not verified as successful.');
    let raw = {};
    try { raw = r.raw_event ? (typeof r.raw_event === 'string' ? JSON.parse(r.raw_event) : r.raw_event) : {}; } catch (_) {}
    const bankTranId = raw?.validation?.bank_tran_id || raw?.validation?.bank_tranid || raw?.bank_tran_id;
    if (!bankTranId) throw problem(409, 'The verified payment has no bank_tran_id. Reconcile the original transaction before refunding.');
    const refundTransId = `BBR${Date.now()}${crypto.randomBytes(5).toString('hex').toUpperCase()}`.slice(0, 30);
    await conn.execute(
      `UPDATE refunds SET status = 'pending', provider_refund_trans_id = ?,
              processed_by = ?, processed_at = UTC_TIMESTAMP()
        WHERE id = ? AND status = 'requested'`,
      [refundTransId, adminId, refundId]
    );
    return {
      id: r.id, payment_id: r.payment_id, amount: money(r.amount),
      reason: r.reason || 'Customer refund', bankTranId,
      refundTransId, currency_code: r.currency_code
    };
  });

  if (prepared.reused) return prepared;

  let result;
  try {
    result = await gatewayGet({
      bank_tran_id: prepared.bankTranId,
      refund_trans_id: prepared.refundTransId,
      refund_amount: prepared.amount,
      refund_remarks: String(prepared.reason).slice(0, 255),
      refe_id: String(prepared.id),
      v: '1'
    });
  } catch (error) {
    // Keep pending: timeout/network errors are ambiguous and must be reconciled,
    // not retried with a second refund transaction ID.
    await pool.execute(
      `UPDATE refunds SET provider_refund_response = ? WHERE id = ?`,
      [JSON.stringify({ transport_error: error.message, submitted_at: new Date().toISOString() }), prepared.id]
    );
    throw problem(502, 'Refund submission outcome is unknown. Do not submit again; reconcile this refund before taking further action.');
  }

  const apiConnect = String(result.APIConnect || '').toUpperCase();
  const status = String(result.status || '').toLowerCase();
  if (apiConnect !== 'DONE') {
    await pool.execute(
      `UPDATE refunds SET provider_refund_response = ? WHERE id = ?`,
      [JSON.stringify(result), prepared.id]
    );
    throw problem(502, `SSLCommerz refund API connection status: ${apiConnect || 'UNKNOWN'}. Refund remains pending for reconciliation.`);
  }

  if (status === 'failed') {
    await pool.execute(
      `UPDATE refunds SET status = 'failed', provider_refund_response = ?,
              processed_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'pending'`,
      [JSON.stringify(result), prepared.id]
    );
    return { refund_id: prepared.id, status: 'failed', gateway_response: result };
  }

  await pool.execute(
    `UPDATE refunds SET provider_refund_id = ?, provider_refund_response = ?,
            last_checked_at = UTC_TIMESTAMP()
      WHERE id = ? AND status = 'pending'`,
    [result.refund_ref_id || null, JSON.stringify(result), prepared.id]
  );
  return {
    refund_id: prepared.id,
    status: 'pending',
    provider_refund_id: result.refund_ref_id || null,
    gateway_status: status || 'unknown',
    message: status === 'success' ? 'Refund initiated; final settlement must be confirmed by querying refund status.' :
      'Gateway reports the request is processing or its status is not final.'
  };
}

async function reconcile(adminId, refundId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.status, r.provider_refund_id, r.provider_refund_trans_id,
            p.id AS payment_id, p.booking_id
       FROM refunds r JOIN payments p ON p.id = r.payment_id
      WHERE r.id = ? AND p.provider = 'sslcommerz'`, [refundId]
  );
  if (!rows.length) throw problem(404, 'SSLCommerz refund not found.');
  const refund = rows[0];
  if (!refund.provider_refund_id) {
    throw problem(409, 'No SSLCommerz refund_ref_id is stored yet. Resolve the initiation outcome with the gateway/merchant support before retrying.');
  }
  const result = await gatewayGet({ refund_ref_id: refund.provider_refund_id });
  if (String(result.APIConnect || '').toUpperCase() !== 'DONE') {
    throw problem(502, `SSLCommerz refund query failed: ${result.APIConnect || 'UNKNOWN'}.`);
  }
  const gatewayStatus = String(result.status || '').toLowerCase();
  let nextStatus = null;
  if (gatewayStatus === 'refunded') nextStatus = 'succeeded';
  else if (gatewayStatus === 'cancelled') nextStatus = 'cancelled';
  else if (gatewayStatus === 'failed') nextStatus = 'failed';
  else if (gatewayStatus === 'processing') nextStatus = 'pending';

  if (!nextStatus) throw problem(502, `Unrecognized SSLCommerz refund status: ${gatewayStatus || 'empty'}.`);

  return withTransaction(async (conn) => {
    const [locked] = await conn.execute(
      `SELECT r.*, p.booking_id FROM refunds r JOIN payments p ON p.id = r.payment_id
        WHERE r.id = ? FOR UPDATE`, [refundId]
    );
    if (!locked.length) throw problem(404, 'Refund not found.');
    const current = locked[0];
    if (['succeeded', 'failed', 'cancelled'].includes(current.status) && current.status !== nextStatus) {
      throw problem(409, 'Gateway status conflicts with a terminal local refund status. Manual investigation is required.');
    }
    await conn.execute(
      `UPDATE refunds SET status = ?, provider_refund_response = ?,
              last_checked_at = UTC_TIMESTAMP(), processed_by = ?,
              processed_at = CASE WHEN ? IN ('succeeded','failed','cancelled') THEN UTC_TIMESTAMP() ELSE processed_at END
        WHERE id = ?`,
      [nextStatus, JSON.stringify(result), adminId, nextStatus, refundId]
    );

    const [[payment]] = await conn.execute(
      'SELECT amount, status FROM payments WHERE id = ? FOR UPDATE', [current.payment_id]
    );
    const [[sums]] = await conn.execute(
      `SELECT COALESCE(SUM(CASE WHEN status IN ('requested','pending','succeeded') THEN amount ELSE 0 END),0) AS committed,
              COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END),0) AS refunded
         FROM refunds WHERE payment_id = ?`, [current.payment_id]
    );
    if (Number(sums.committed) - Number(payment.amount) > 0.0001) {
      throw problem(409, 'Committed refunds exceed original payment amount; manual reconciliation required.');
    }
    if (payment.status === 'succeeded') {
      const paid = Number(payment.amount), refunded = Number(sums.refunded);
      const bookingStatus = refunded >= paid - 0.005 ? 'refunded' :
        refunded > 0 ? 'partially_refunded' : 'paid';
      await conn.execute('UPDATE bookings SET payment_status = ? WHERE id = ?', [bookingStatus, current.booking_id]);
    }
    return {
      refund_id: refundId, status: nextStatus, gateway_status: gatewayStatus,
      provider_refund_id: current.provider_refund_id,
      checked_at: new Date().toISOString()
    };
  });
}

module.exports = { initiate, reconcile };
