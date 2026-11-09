const CATEGORIES = new Set(["general","booking","payment","refund","tour","account","technical","other"]);
const STATUSES = new Set(["open","in_progress","waiting_customer","resolved","closed"]);
const PRIORITIES = new Set(["low","normal","high","urgent"]);

function requiredText(value, max, field) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    const error = new Error(`${field} is required and must be at most ${max} characters`);
    error.statusCode = 400;
    throw error;
  }
  return value.trim();
}
function optionalText(value, max, field) {
  if (value == null || value === "") return null;
  return requiredText(value, max, field);
}
function email(value) {
  const v = requiredText(value, 190, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    const error = new Error("A valid email address is required");
    error.statusCode = 400;
    throw error;
  }
  return v;
}
function enumValue(value, allowed, field) {
  if (value == null) return undefined;
  if (!allowed.has(value)) {
    const error = new Error(`Invalid ${field}`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}
function positiveId(value, field = "id") {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) {
    const error = new Error(`A valid ${field} is required`);
    error.statusCode = 400;
    throw error;
  }
  return n;
}
module.exports = {
  CATEGORIES, STATUSES, PRIORITIES, requiredText, optionalText, email, enumValue, positiveId
};
