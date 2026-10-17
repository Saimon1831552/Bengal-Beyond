const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const service = require("./tour.service");

const list = asyncHandler(async (req, res) => {
  const result = await service.listTours(req.validated.query);
  return sendSuccess(res, result.data, { meta: result.meta });
});

const getBySlug = asyncHandler(async (req, res) => {
  const tour = await service.getTour(req.validated.params.slug);
  return sendSuccess(res, tour);
});

module.exports = { list, getBySlug };
