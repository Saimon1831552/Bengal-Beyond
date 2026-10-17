const { sendSuccess } = require("../../utils/response");
const service = require("./admin-settings.service");

async function list(req, res) {
  return sendSuccess(res, await service.list(req.validated.query));
}

async function update(req, res) {
  const result = await service.updateSettings(
    { [req.validated.params.key]: req.validated.body.value },
    req.auth.userId,
    req.validated.body.reason,
  );
  return sendSuccess(res, result);
}

async function bulkUpdate(req, res) {
  const result = await service.updateSettings(
    req.validated.body.settings,
    req.auth.userId,
    req.validated.body.reason,
  );
  return sendSuccess(res, result);
}

async function history(req, res) {
  return sendSuccess(res, await service.history(req.validated.query));
}

module.exports = { list, update, bulkUpdate, history };
