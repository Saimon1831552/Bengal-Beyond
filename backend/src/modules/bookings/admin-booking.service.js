const repository = require("./admin-booking.repository");
const AppError = require("../../utils/appError");

async function list(query) {
  const { rows, total } = await repository.list(query);
  return { items: rows, pagination: { page: query.page, limit: query.limit, total, total_pages: Math.ceil(total / query.limit) } };
}
async function get(id) {
  const booking = await repository.findById(id);
  if (!booking) throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found");
  return booking;
}
async function changeStatus(id, body, user) {
  const permission = body.status === "confirmed" ? "bookings.confirm" : body.status === "rejected" ? "bookings.reject" : "bookings.manage";
  // Route middleware performs the general bookings.manage check. The additional permission is enforced below if auth exposes permissions.
  if (Array.isArray(user?.permissions) && !user.permissions.includes(permission) && permission !== "bookings.manage") {
    throw new AppError(403, "INSUFFICIENT_PERMISSION", "Insufficient permission");
  }
  const result = await repository.updateStatus(id, body.status, user?.id, body.note);
  if (result.notFound) throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found");
  if (result.invalidTransition) throw new AppError(409, "INVALID_BOOKING_TRANSITION", `Status transition not allowed: ${result.from} -> ${result.to}`);
  if (result.paymentRequired) throw new AppError(409, "PAYMENT_REQUIRED", "Booking cannot be confirmed until payment is paid or not_required", { payment_status: result.payment_status });
  return result;
}
async function note(id, body, user) {
  const adminId = user?.id || user?.userId;
  if (!adminId) throw new AppError(401, "INVALID_SESSION", "Authenticated user id is missing");
  const created = await repository.addNote(id, adminId, body.note, body.visibility);
  if (!created) throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found");
  return created;
}
module.exports = { list, get, changeStatus, note };
