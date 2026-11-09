const service = require("./pricing.service");
const { normalizeCode, parseBookingId } = require("./pricing.validation");

function send(res, data, message) {
  return res.status(200).json({ success: true, message, data });
}
function idOrFail(value) {
  const id = parseBookingId(value);
  if (!id) {
    const error = new Error("A valid bookingId is required");
    error.statusCode = 400;
    throw error;
  }
  return id;
}
exports.getPricing = async (req, res, next) => {
  try {
    const data = await service.getPricing({ bookingId: idOrFail(req.params.bookingId), userId: req.user.id });
    return send(res, data, "Booking pricing retrieved");
  } catch (error) { next(error); }
};
exports.applyCoupon = async (req, res, next) => {
  try {
    const code = normalizeCode(req.body && req.body.code);
    if (!code) {
      const error = new Error("Coupon code must be 2–40 letters, numbers, hyphens or underscores");
      error.statusCode = 400;
      throw error;
    }
    const data = await service.applyCoupon({
      bookingId: idOrFail(req.params.bookingId), userId: req.user.id, code
    });
    return send(res, data, "Coupon applied and booking total updated");
  } catch (error) { next(error); }
};
exports.removeCoupon = async (req, res, next) => {
  try {
    const data = await service.removeCoupon({ bookingId: idOrFail(req.params.bookingId), userId: req.user.id });
    return send(res, data, "Coupon removal processed");
  } catch (error) { next(error); }
};
