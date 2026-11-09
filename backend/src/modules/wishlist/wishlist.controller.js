const service = require("./wishlist.service");
const { positiveId, pagination } = require("./wishlist.validation");
const { sendSuccess } = require("../../utils/response");

function currentUserId(req) {
  // The existing authentication middleware must set req.user.id.
  // This module deliberately does not invent or bypass authentication.
  return positiveId(req.user && req.user.id, "authenticated user id");
}

module.exports = {
  list: async (req, res) => {
    const result = await service.list(currentUserId(req), pagination(req.query));
    return sendSuccess(res, result.items, { meta: result.pagination });
  },
  add: async (req, res) => {
    const result = await service.add(currentUserId(req), positiveId(req.params.tourId, "tourId"));
    return sendSuccess(res, result, { status: 201 });
  },
  remove: async (req, res) => {
    const result = await service.remove(currentUserId(req), positiveId(req.params.tourId, "tourId"));
    return sendSuccess(res, result);
  },
  contains: async (req, res) => {
    const result = await service.contains(currentUserId(req), positiveId(req.params.tourId, "tourId"));
    return sendSuccess(res, result);
  }
};
