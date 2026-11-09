function fail(message, statusCode = 400) { const e = new Error(message); e.statusCode = statusCode; throw e; }
function positiveInt(value, field) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(`${field} must be a positive integer`);
  return n;
}
function parseDate(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?$/.test(value)) fail(`${field} must be a valid date/time`);
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) fail(`${field} is invalid`);
  return value;
}
function validateCreate(body) {
  const tourId = positiveInt(body.tourId, "tourId");
  const startsAt = parseDate(body.startsAt, "startsAt");
  const endsAt = parseDate(body.endsAt, "endsAt");
  if (new Date(endsAt) <= new Date(startsAt)) fail("endsAt must be later than startsAt");
  const seatCapacity = positiveInt(body.seatCapacity, "seatCapacity");
  if (body.priceOverride !== undefined && body.priceOverride !== null &&
      !/^\d{1,10}(?:\.\d{1,2})?$/.test(String(body.priceOverride))) fail("priceOverride must be a non-negative amount with up to 2 decimals");
  if (body.status !== undefined && !["scheduled", "cancelled", "completed"].includes(body.status)) fail("Invalid departure status");
  return { tourId, startsAt, endsAt, seatCapacity, priceOverride: body.priceOverride ?? null, status: body.status || "scheduled" };
}
function validateUpdate(body) {
  const out = {};
  if (body.startsAt !== undefined) out.startsAt = parseDate(body.startsAt, "startsAt");
  if (body.endsAt !== undefined) out.endsAt = parseDate(body.endsAt, "endsAt");
  if (body.seatCapacity !== undefined) out.seatCapacity = positiveInt(body.seatCapacity, "seatCapacity");
  if (body.priceOverride !== undefined) {
    if (body.priceOverride !== null && !/^\d{1,10}(?:\.\d{1,2})?$/.test(String(body.priceOverride))) fail("priceOverride must be null or a non-negative amount with up to 2 decimals");
    out.priceOverride = body.priceOverride;
  }
  if (body.status !== undefined) {
    if (!["scheduled", "cancelled", "completed"].includes(body.status)) fail("Invalid departure status");
    out.status = body.status;
  }
  if (!Object.keys(out).length) fail("At least one supported field is required");
  return out;
}
module.exports = { positiveInt, validateCreate, validateUpdate };
