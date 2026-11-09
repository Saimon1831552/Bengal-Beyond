const service = require("./coupon.service");
const { id, code, create, update, pagination } = require("./coupon.validation");
const { sendSuccess } = require("../../utils/response");
function userId(req) {
  const value = req.user && req.user.id;
  if (!Number.isSafeInteger(Number(value)) || Number(value) < 1) {
    const e = new Error("Authenticated user identity is required"); e.statusCode = 401; throw e;
  }
  return Number(value);
}
module.exports = {
  adminList: async (req, res) => {
    const status = req.query.status || undefined;
    if (status && !["active", "inactive"].includes(status)) { const e = new Error("status must be active or inactive"); e.statusCode = 400; throw e; }
    const q = String(req.query.q || "").trim().slice(0, 100);
    const result = await service.list({ ...pagination(req.query), q, status });
    return sendSuccess(res, result.items, { meta: result.pagination });
  },
  get: async (req, res) => sendSuccess(res, await service.get(id(req.params.id))),
  create: async (req, res) => sendSuccess(res, await service.create(create(req.body)), 201),
  update: async (req, res) => sendSuccess(res, await service.update(id(req.params.id), update(req.body))),
  remove: async (req, res) => {
    await service.remove(id(req.params.id));
    return sendSuccess(res, { message: "Coupon deleted" });
  },
  validate: async (req, res) => {
    if (!req.body || req.body.bookingId === undefined) { const e = new Error("bookingId is required"); e.statusCode = 400; throw e; }
    return sendSuccess(res, await service.validateForBooking({
      code: code(req.body.code), bookingId: id(req.body.bookingId, "bookingId"), userId: userId(req)
    }));
  }
};
