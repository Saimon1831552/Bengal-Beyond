const service = require("./admin-departure.service");
const { sendSuccess } = require("../../utils/response");
const asyncHandler = require("../../utils/asyncHandler");

module.exports = {
  list: asyncHandler(async (req, res) => {
    const result = await service.list(req.validated.query);
    return sendSuccess(res, result.rows, { meta: { page: req.validated.query.page, limit: req.validated.query.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / req.validated.query.limit)) } });
  }),
  get: asyncHandler(async (req, res) => sendSuccess(res, await service.get(req.validated.params.id))),
  create: asyncHandler(async (req, res) => sendSuccess(res, await service.create(req.validated.body), { status: 201 })),
  update: asyncHandler(async (req, res) => sendSuccess(res, await service.update(req.validated.params.id, req.validated.body))),
  changeStatus: asyncHandler(async (req, res) => sendSuccess(res, await service.changeStatus(req.validated.params.id, req.validated.body.status))),
  remove: asyncHandler(async (req, res) => sendSuccess(res, await service.remove(req.validated.params.id))),
};
