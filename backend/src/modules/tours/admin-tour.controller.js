const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const service = require("./admin-tour.service");

const create = asyncHandler(async (req, res) => {
  const tour = await service.createTour(req.validated.body, req.auth.userId);
  return sendSuccess(res, tour, { status: 201 });
});
const update = asyncHandler(async (req, res) => {
  const tour = await service.updateTour(req.validated.params.id, req.validated.body, req.auth.userId);
  return sendSuccess(res, tour);
});
const changeStatus = asyncHandler(async (req, res) => {
  const tour = await service.changeStatus(req.validated.params.id, req.validated.body.status, req.auth.userId);
  return sendSuccess(res, tour);
});
const remove = asyncHandler(async (req, res) => {
  const result = await service.deleteTour(req.validated.params.id, req.auth.userId);
  return sendSuccess(res, result);
});
module.exports = { create, update, changeStatus, remove };
