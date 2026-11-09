const service = require('./sslcommerz-refund.service');
function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
exports.initiate = asyncRoute(async (req, res) => {
  const data = await service.initiate(req.user.id, Number(req.params.refundId));
  res.status(202).json({ success: true, data });
});
exports.reconcile = asyncRoute(async (req, res) => {
  const data = await service.reconcile(req.user.id, Number(req.params.refundId));
  res.json({ success: true, data });
});
