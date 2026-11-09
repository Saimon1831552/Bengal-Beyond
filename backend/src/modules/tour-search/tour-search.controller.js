const { parseSearchQuery } = require("./tour-search.validation");
const service = require("./tour-search.service");
const { sendSuccess } = require("../../utils/response");

async function search(req, res) {
  const filters = parseSearchQuery(req.query);
  const result = await service.search(filters);
  return sendSuccess(res, result.items, { meta: result.pagination });
}
module.exports = { search };
