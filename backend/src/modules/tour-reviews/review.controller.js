const service = require("./review.service");
const { id, createReview, moderation } = require("./review.validation");
const { sendSuccess } = require("../../utils/response");

function pagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
    const e = new Error("page must be a positive integer"); e.statusCode = 400; throw e;
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    const e = new Error("limit must be between 1 and 50"); e.statusCode = 400; throw e;
  }
  return { page, limit, offset: (page - 1) * limit };
}
function authenticatedUserId(req) {
  // Adapt this accessor if your authentication middleware uses a different property.
  return id(req.user && req.user.id, "authenticated user id");
}
module.exports = {
  list: async (req, res) => {
    const result = await service.listPublished(id(req.params.tourId, "tourId"), pagination(req.query));
    return sendSuccess(res, result.items, { meta: { summary: result.summary, pagination: result.pagination } });
  },
  submit: async (req, res) => {
    const payload = createReview(req.body);
    const result = await service.submit({
      tourId: id(req.params.tourId, "tourId"), userId: authenticatedUserId(req), ...payload
    });
    return sendSuccess(res, result, { status: 201 });
  },
  adminList: async (req, res) => {
    const status = req.query.status || undefined;
    if (status && !["pending", "published", "rejected"].includes(status)) {
      const e = new Error("status must be pending, published or rejected"); e.statusCode = 400; throw e;
    }
    const result = await service.adminList({ ...pagination(req.query), status });
    return sendSuccess(res, result.items, { meta: { pagination: result.pagination } });
  },
  moderate: async (req, res) => {
    const moderatorId = authenticatedUserId(req);
    return sendSuccess(res, await service.moderate(
      id(req.params.id, "review id"), moderation(req.body), moderatorId
    ));
  }
};
