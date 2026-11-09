const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const service = require("./lifecycle.service");

module.exports = {
  requestVerification: asyncHandler(async (req, res) => sendSuccess(res, await service.requestEmailVerification(req.validated.body.email))),
  verifyEmail: asyncHandler(async (req, res) => sendSuccess(res, await service.verifyEmail(req.validated.body.token))),
  requestPasswordReset: asyncHandler(async (req, res) => sendSuccess(res, await service.requestPasswordReset(req.validated.body.email))),
  resetPassword: asyncHandler(async (req, res) => sendSuccess(res, await service.resetPassword(req.validated.body.token, req.validated.body.password))),
};
