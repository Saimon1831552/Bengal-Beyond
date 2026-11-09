const service = require("./customer-payment.service");

function authId(req, res) {
  const id = Number(req.user && req.user.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return null;
  }
  return id;
}
function positiveId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
function fail(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error("Customer payment error:", error);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? "An unexpected error occurred." : error.message,
  });
}
async function listPayments(req, res) {
  const userId = authId(req, res);
  if (!userId) return;
  try {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    return res.json({ success: true, data: await service.listPayments(userId, page, limit) });
  } catch (error) { return fail(res, error); }
}
async function getPayment(req, res) {
  const userId = authId(req, res);
  if (!userId) return;
  const paymentId = positiveId(req.params.paymentId);
  if (!paymentId) return res.status(400).json({ success: false, message: "Invalid payment ID." });
  try { return res.json({ success: true, data: await service.getPayment(userId, paymentId) }); }
  catch (error) { return fail(res, error); }
}
async function initiatePayment(req, res) {
  const userId = authId(req, res);
  if (!userId) return;
  const bookingId = positiveId(req.params.bookingId);
  if (!bookingId) return res.status(400).json({ success: false, message: "Invalid booking ID." });
  try {
    const data = await service.initiatePayment(userId, bookingId, req.body || {});
    return res.status(data.reused ? 200 : 201).json({ success: true, data });
  } catch (error) { return fail(res, error); }
}
module.exports = { listPayments, getPayment, initiatePayment };
