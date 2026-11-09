function positiveId(value, field = "id") {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) {
    const e = new Error(`${field} must be a positive integer`); e.statusCode = 400; throw e;
  }
  return n;
}
function pagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
    const e = new Error("page must be a positive integer"); e.statusCode = 400; throw e;
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    const e = new Error("limit must be between 1 and 50"); e.statusCode = 400; throw e;
  }
  return { page, limit, offset: (page - 1) * limit };
}
module.exports = { positiveId, pagination };
