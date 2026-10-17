const repo = require("./admin-departure.repository");
const AppError = require("../../utils/appError");

function toSqlDateTime(value, field) {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw AppError.validation([{ path: field, message: "Must be a valid date/time" }]);
  // Normalize instants to UTC because the schema documents UTC storage.
  return date.toISOString().slice(0, 19).replace("T", " ");
}
function normalizeDates(data) {
  const result = { ...data };
  if (Object.hasOwn(result, "starts_at")) result.starts_at = toSqlDateTime(result.starts_at, "starts_at");
  if (Object.hasOwn(result, "ends_at")) result.ends_at = toSqlDateTime(result.ends_at, "ends_at");
  if (result.starts_at && result.ends_at && result.ends_at < result.starts_at) {
    throw AppError.validation([{ path: "ends_at", message: "Must be on or after starts_at" }]);
  }
  return result;
}
async function list(query) { return repo.list(query); }
async function get(id) {
  const departure = await repo.findById(id);
  if (!departure) throw AppError.notFound("Departure not found");
  return departure;
}
async function create(input) {
  const data = normalizeDates(input);
  if (data.ends_at && data.ends_at < data.starts_at) throw AppError.validation([{ path: "ends_at", message: "Must be on or after starts_at" }]);
  if (!(await repo.tourExists(data.tour_id))) throw AppError.notFound("Tour not found");
  return repo.create(data);
}
async function update(id, input) {
  const current = await repo.findById(id);
  if (!current) throw AppError.notFound("Departure not found");
  const data = normalizeDates(input);
  const tourId = data.tour_id ?? Number(current.tour_id);
  if (data.tour_id && !(await repo.tourExists(tourId))) throw AppError.notFound("Tour not found");
  const start = data.starts_at ?? current.starts_at;
  const end = Object.hasOwn(data, "ends_at") ? data.ends_at : current.ends_at;
  if (end && new Date(end) < new Date(start)) throw AppError.validation([{ path: "ends_at", message: "Must be on or after starts_at" }]);
  const capacity = data.seat_capacity ?? Number(current.seat_capacity);
  if (capacity < Number(current.seats_reserved)) {
    throw AppError.conflict("Seat capacity cannot be lower than seats already reserved");
  }
  if (current.status === "cancelled" || current.status === "completed") {
    throw AppError.conflict("Cancelled or completed departures cannot be edited");
  }
  return repo.update(id, data);
}
async function changeStatus(id, status) {
  const current = await repo.findById(id);
  if (!current) throw AppError.notFound("Departure not found");
  if (current.status === "completed" && status !== "completed") throw AppError.conflict("Completed departures cannot be reopened");
  if (current.status === "cancelled" && status === "scheduled") throw AppError.conflict("Cancelled departures cannot be rescheduled; create a new departure instead");
  if (status === "completed" && new Date(current.starts_at) > new Date()) throw AppError.conflict("A future departure cannot be marked completed");
  if (status === "scheduled" && Number(current.seats_reserved) >= Number(current.seat_capacity)) throw AppError.conflict("Departure has no remaining seats");
  return repo.changeStatus(id, status);
}
async function remove(id) {
  const result = await repo.removeIfUnreserved(id);
  if (result.missing) throw AppError.notFound("Departure not found");
  if (result.conflict) throw AppError.conflict("Departure cannot be deleted because it has reserved seats or booking history");
  return { id };
}
module.exports = { list, get, create, update, changeStatus, remove };
