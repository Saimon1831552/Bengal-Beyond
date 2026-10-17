// One response shape for every successful call:
//   { success: true, data: ..., meta?: ... }
function sendSuccess(res, data = null, { status = 200, meta } = {}) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

module.exports = { sendSuccess };