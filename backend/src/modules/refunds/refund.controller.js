const service = require('./refund.service');
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
exports.adminList = asyncRoute(async (req, res) => {
  const result = await service.listRefunds({ page: req.query.page, limit: req.query.limit, status: req.query.status, paymentId: req.query.payment_id });
  res.json({ success: true, data: result });
});
exports.create = asyncRoute(async (req, res) => {
  const result = await service.createRefund(req.user.id, Number(req.params.paymentId), req.body.amount, req.body.reason);
  res.status(201).json({ success: true, data: result, message: 'Refund request recorded. Complete the refund in the SSLCommerz merchant panel, then update its status here.' });
});
exports.update = asyncRoute(async (req, res) => {
  const result = await service.updateRefund(req.user.id, Number(req.params.refundId), req.body.status, req.body.provider_refund_id);
  res.json({ success: true, data: result });
});
exports.customerList = asyncRoute(async (req, res) => {
  const result = await service.listCustomerRefunds(req.user.id, { page: req.query.page, limit: req.query.limit });
  res.json({ success: true, data: result });
});
