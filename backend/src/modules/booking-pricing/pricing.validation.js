const CODE = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;

function normalizeCode(value) {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return CODE.test(code) ? code : null;
}

function parseBookingId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

module.exports = { normalizeCode, parseBookingId };
