const service = require("./customer-booking.service");

function customerId(req, res) {
  const id = req.user && req.user.id;
  if (!id || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return null;
  }
  return Number(id);
}

function positiveId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function sendError(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error("Customer booking error:", error);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? "An unexpected error occurred." : error.message,
  });
}

async function listBookings(req, res) {
  const userId = customerId(req, res);
  if (!userId) return;
  try {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(50, Number.parseInt(req.query.limit, 10) || 10));
    const result = await service.listBookings(userId, { page, limit });
    return res.json({ success: true, data: result });
  } catch (error) { return sendError(res, error); }
}

async function getBooking(req, res) {
  const userId = customerId(req, res);
  if (!userId) return;
  const bookingId = positiveId(req.params.bookingId);
  if (!bookingId) return res.status(400).json({ success: false, message: "Invalid booking ID." });
  try {
    const data = await service.getBooking(userId, bookingId);
    return res.json({ success: true, data });
  } catch (error) { return sendError(res, error); }
}

async function replaceTravelers(req, res) {
  const userId = customerId(req, res);
  if (!userId) return;
  const bookingId = positiveId(req.params.bookingId);
  if (!bookingId) return res.status(400).json({ success: false, message: "Invalid booking ID." });
  try {
    const data = await service.replaceTravelers(userId, bookingId, req.body || {});
    return res.json({ success: true, data });
  } catch (error) { return sendError(res, error); }
}

async function updateSpecialRequests(req, res) {
  const userId = customerId(req, res);
  if (!userId) return;
  const bookingId = positiveId(req.params.bookingId);
  if (!bookingId) return res.status(400).json({ success: false, message: "Invalid booking ID." });
  try {
    const data = await service.updateSpecialRequests(userId, bookingId, req.body || {});
    return res.json({ success: true, data });
  } catch (error) { return sendError(res, error); }
}

async function requestCancellation(req, res) {
  const userId = customerId(req, res);
  if (!userId) return;
  const bookingId = positiveId(req.params.bookingId);
  if (!bookingId) return res.status(400).json({ success: false, message: "Invalid booking ID." });
  try {
    const data = await service.requestCancellation(userId, bookingId, req.body || {});
    return res.status(201).json({ success: true, data });
  } catch (error) { return sendError(res, error); }
}

module.exports = { listBookings, getBooking, replaceTravelers, updateSpecialRequests, requestCancellation };
