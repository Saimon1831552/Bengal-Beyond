const service = require("./dashboard.service");
const { sendSuccess } = require("../../utils/response");

async function getDashboard(req, res) {
  const data = await service.getDashboard(req.validated.query.months);
  return sendSuccess(res, data);
}

module.exports = { getDashboard };
