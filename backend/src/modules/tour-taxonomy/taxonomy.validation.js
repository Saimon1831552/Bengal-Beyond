const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function text(value, field, max, required = false) {
  if (required && (typeof value !== "string" || !value.trim())) {
    const e = new Error(`${field} is required`); e.statusCode = 400; throw e;
  }
  if (value !== undefined && value !== null &&
      (typeof value !== "string" || value.trim().length > max)) {
    const e = new Error(`${field} must be a string of at most ${max} characters`);
    e.statusCode = 400; throw e;
  }
}
function validateTaxonomy(body, { slugRequired = false } = {}) {
  text(body.name, "name", 120, true);
  text(body.slug, "slug", 140, slugRequired);
  text(body.description, "description", 1000);
  if (body.slug !== undefined && !slugPattern.test(body.slug)) {
    const e = new Error("slug must contain lowercase letters, numbers and hyphens");
    e.statusCode = 400; throw e;
  }
  if (body.status !== undefined && !["active", "inactive"].includes(body.status)) {
    const e = new Error("status must be active or inactive"); e.statusCode = 400; throw e;
  }
}
function positiveId(value, field = "id") {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) {
    const e = new Error(`${field} must be a positive integer`); e.statusCode = 400; throw e;
  }
  return n;
}
module.exports = { validateTaxonomy, positiveId };
