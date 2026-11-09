const service = require("./taxonomy.service");
const { validateTaxonomy, positiveId } = require("./taxonomy.validation");
const { sendSuccess } = require("../../utils/response");

function handlers(kind) {
  return {
    list: async (req, res) => sendSuccess(res, await service.list(kind, {
      includeInactive: req.query.includeInactive === "true", q: String(req.query.q || "").trim().slice(0, 100)
    })),
    get: async (req, res) => sendSuccess(res, await service.get(kind, positiveId(req.params.id))),
    create: async (req, res) => {
      validateTaxonomy(req.body, { slugRequired: true });
      return sendSuccess(res, await service.create(kind, req.body), 201);
    },
    update: async (req, res) => {
      validateTaxonomy(req.body);
      return sendSuccess(res, await service.update(kind, positiveId(req.params.id), req.body));
    },
    remove: async (req, res) => {
      await service.remove(kind, positiveId(req.params.id));
      return sendSuccess(res, { message: "Deleted" });
    }
  };
}
module.exports = {
  categories: handlers("categories"),
  tags: handlers("tags"),
  assign: async (req, res) => {
    const tourId = positiveId(req.params.tourId, "tourId");
    const categories = req.body.categoryIds === undefined ? [] : req.body.categoryIds;
    const tags = req.body.tagIds === undefined ? [] : req.body.tagIds;
    if (!Array.isArray(categories) || !Array.isArray(tags)) {
      const e = new Error("categoryIds and tagIds must be arrays"); e.statusCode = 400; throw e;
    }
    return sendSuccess(res, await service.assign(tourId, categories, tags));
  },
  tourTaxonomy: async (req, res) =>
    sendSuccess(res, await service.tourTaxonomy(positiveId(req.params.tourId, "tourId")))
};
