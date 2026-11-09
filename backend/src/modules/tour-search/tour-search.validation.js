const ALLOWED_SORTS = new Set(["recommended", "price_asc", "price_desc", "duration_asc", "duration_desc", "newest", "departure_soon"]);
function bad(message) { const e = new Error(message); e.statusCode = 400; throw e; }
function intQuery(value, name, { min = 1, max = 1000000000, optional = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return undefined;
    bad(`${name} is required`);
  }
  if (!/^\d+$/.test(String(value))) bad(`${name} must be a positive integer`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) bad(`${name} must be between ${min} and ${max}`);
  return n;
}
function dateQuery(value, name) {
  if (value === undefined || value === "") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) bad(`${name} must use YYYY-MM-DD`);
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) bad(`${name} is not a valid date`);
  return value;
}
function moneyQuery(value, name) {
  if (value === undefined || value === "") return undefined;
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(String(value))) bad(`${name} must be a non-negative amount with up to 2 decimals`);
  return String(value);
}
function parseSearchQuery(query) {
  const page = intQuery(query.page, "page", { min: 1, max: 100000, optional: true }) || 1;
  const limit = intQuery(query.limit, "limit", { min: 1, max: 50, optional: true }) || 12;
  const minDuration = intQuery(query.minDuration, "minDuration", { min: 1, max: 3650 });
  const maxDuration = intQuery(query.maxDuration, "maxDuration", { min: 1, max: 3650 });
  const minPrice = moneyQuery(query.minPrice, "minPrice");
  const maxPrice = moneyQuery(query.maxPrice, "maxPrice");
  if (minDuration && maxDuration && minDuration > maxDuration) bad("minDuration cannot exceed maxDuration");
  if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) bad("minPrice cannot exceed maxPrice");
  const departureFrom = dateQuery(query.departureFrom, "departureFrom");
  const departureTo = dateQuery(query.departureTo, "departureTo");
  if (departureFrom && departureTo && departureFrom > departureTo) bad("departureFrom cannot be after departureTo");
  const sort = query.sort || "recommended";
  if (!ALLOWED_SORTS.has(sort)) bad(`sort must be one of: ${[...ALLOWED_SORTS].join(", ")}`);
  const q = String(query.q || "").trim();
  if (q.length > 120) bad("q must be at most 120 characters");
  const destination = String(query.destination || "").trim();
  if (destination.length > 160) bad("destination must be at most 160 characters");
  return {
    page, limit, offset: (page - 1) * limit, q, destination, sort,
    destinationId: intQuery(query.destinationId, "destinationId"),
    categoryId: intQuery(query.categoryId, "categoryId"),
    tagId: intQuery(query.tagId, "tagId"),
    minDuration, maxDuration, minPrice, maxPrice, departureFrom, departureTo,
    availableOnly: query.availableOnly === "true"
  };
}
module.exports = { parseSearchQuery };
