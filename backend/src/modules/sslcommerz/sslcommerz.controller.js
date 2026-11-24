const service = require('./sslcommerz.service');
const env = require('../../config/env');

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

exports.initiate = asyncRoute(async (req, res) => {
  const result = await service.initiate(req.user.id, Number(req.params.bookingId), {
    idempotencyKey: req.body.idempotency_key,
    paymentOption: req.body.payment_option || 'full',
    amount: req.body.amount,
  });
  res.status(201).json({ success: true, data: result });
});

exports.getPayment = asyncRoute(async (req, res) => {
  const payment = await service.getOwnedPayment(req.user.id, Number(req.params.paymentId));
  res.json({ success: true, data: payment });
});

exports.ipn = asyncRoute(async (req, res) => {
  const result = await service.validateAndApply(req.body || {});
  res.status(200).json({ success: true, data: result });
});

async function returnToFrontend(req, res, next) {
  try {
    const payload = req.body && Object.keys(req.body).length ? req.body : req.query;
    let applied = null;
    if (payload.val_id) applied = await service.validateAndApply(payload);
    const status = req.path.endsWith('/success') ? 'success' : req.path.endsWith('/cancel') ? 'cancelled' : 'failed';
    const qs = new URLSearchParams({ status });
    if (applied?.booking_id) qs.set('booking_id', String(applied.booking_id));
    if (payload.tran_id) qs.set('tran_id', String(payload.tran_id));
    res.redirect(303, `${env.FRONTEND_URL.replace(/\/$/, '')}/payment-result?${qs.toString()}`);
  } catch (error) { next(error); }
}
exports.success = asyncRoute(returnToFrontend);
exports.fail = asyncRoute(returnToFrontend);
exports.cancel = asyncRoute(returnToFrontend);