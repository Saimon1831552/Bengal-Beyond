const service = require('./sslcommerz.service');
const env = require('../../config/env');

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

exports.initiate = asyncRoute(async (req, res) => {
  const result = await service.initiate(req.user.id, Number(req.params.bookingId), req.body.idempotency_key);
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
    if (payload.val_id) await service.validateAndApply(payload);
    const status = req.path.endsWith('/success') ? 'success' : req.path.endsWith('/cancel') ? 'cancelled' : 'failed';
    // Redirect parameters are informational only; booking/payment status comes from validation/IPN.
    res.redirect(303, `${env.FRONTEND_URL.replace(/\/$/, '')}/payment-result?status=${status}`);
  } catch (error) { next(error); }
}
exports.success = asyncRoute(returnToFrontend);
exports.fail = asyncRoute(returnToFrontend);
exports.cancel = asyncRoute(returnToFrontend);
