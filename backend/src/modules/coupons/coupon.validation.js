function fail(message, statusCode = 400) { const e = new Error(message); e.statusCode = statusCode; throw e; }
function id(value, field = "id") {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(`${field} must be a positive integer`);
  return n;
}
function money(value, field, nullable = false) {
  if (nullable && (value === null || value === undefined || value === "")) return null;
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(String(value))) fail(`${field} must be a non-negative amount with up to 2 decimals`);
  return String(value);
}
function code(value) {
  if (typeof value !== "string") fail("code is required");
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(normalized)) fail("code must be 3-40 characters using letters, numbers, _ or -");
  return normalized;
}
function create(body) {
  if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 160) fail("name is required (max 160 characters)");
  const discountType = body.discountType;
  if (!["percentage", "fixed"].includes(discountType)) fail("discountType must be percentage or fixed");
  const discountValue = money(body.discountValue, "discountValue");
  if (Number(discountValue) <= 0) fail("discountValue must be greater than zero");
  if (discountType === "percentage" && Number(discountValue) > 100) fail("percentage discount cannot exceed 100");
  const usageLimit = body.usageLimit == null || body.usageLimit === "" ? null : id(body.usageLimit, "usageLimit");
  const perUserLimit = body.perUserLimit == null || body.perUserLimit === "" ? 1 : id(body.perUserLimit, "perUserLimit");
  const status = body.status || "active";
  if (!["active", "inactive"].includes(status)) fail("status must be active or inactive");
  const startsAt = body.startsAt || null, endsAt = body.endsAt || null;
  if (startsAt && Number.isNaN(Date.parse(startsAt))) fail("startsAt must be a valid date/time");
  if (endsAt && Number.isNaN(Date.parse(endsAt))) fail("endsAt must be a valid date/time");
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) fail("endsAt must be later than startsAt");
  return {
    code: code(body.code), name: body.name.trim(), description: body.description || null,
    discountType, discountValue, minOrderAmount: money(body.minOrderAmount ?? "0", "minOrderAmount"),
    maxDiscountAmount: money(body.maxDiscountAmount, "maxDiscountAmount", true),
    usageLimit, perUserLimit, startsAt, endsAt, status
  };
}
function update(body) {
  const out = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 160) fail("name must be 1-160 characters");
    out.name = body.name.trim();
  }
  if (body.description !== undefined) out.description = body.description;
  if (body.discountType !== undefined) {
    if (!["percentage", "fixed"].includes(body.discountType)) fail("discountType must be percentage or fixed");
    out.discountType = body.discountType;
  }
  if (body.discountValue !== undefined) out.discountValue = money(body.discountValue, "discountValue");
  if (body.minOrderAmount !== undefined) out.minOrderAmount = money(body.minOrderAmount, "minOrderAmount");
  if (body.maxDiscountAmount !== undefined) out.maxDiscountAmount = money(body.maxDiscountAmount, "maxDiscountAmount", true);
  if (body.usageLimit !== undefined) out.usageLimit = body.usageLimit === null ? null : id(body.usageLimit, "usageLimit");
  if (body.perUserLimit !== undefined) out.perUserLimit = id(body.perUserLimit, "perUserLimit");
  if (body.startsAt !== undefined) out.startsAt = body.startsAt;
  if (body.endsAt !== undefined) out.endsAt = body.endsAt;
  if (body.status !== undefined) {
    if (!["active", "inactive"].includes(body.status)) fail("status must be active or inactive");
    out.status = body.status;
  }
  if (!Object.keys(out).length) fail("No supported fields supplied");
  return out;
}
function pagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isSafeInteger(page) || page < 1) fail("page must be a positive integer");
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) fail("limit must be between 1 and 50");
  return { page, limit, offset: (page - 1) * limit };
}
module.exports = { id, code, create, update, pagination };
