const service = require("./departure.service");
const { positiveInt, validateCreate, validateUpdate } = require("./departure.validation");
const { sendSuccess } = require("../../utils/response");

module.exports = {
  list: async (req, res) => {
    const tourId = positiveInt(req.params.tourId, "tourId");
    const from = req.query.from || undefined, to = req.query.to || undefined;
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) { const e = new Error("from must use YYYY-MM-DD"); e.statusCode = 400; throw e; }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) { const e = new Error("to must use YYYY-MM-DD"); e.statusCode = 400; throw e; }
    return sendSuccess(res, await service.listForTour(tourId, {
      from, to, availableOnly: req.query.availableOnly === "true"
    }));
  },
  create: async (req, res) => sendSuccess(res, await service.create(validateCreate(req.body)), 201),
  update: async (req, res) => sendSuccess(res, await service.update(
    positiveInt(req.params.id, "id"), validateUpdate(req.body)
  )),
  remove: async (req, res) => {
    await service.remove(positiveInt(req.params.id, "id"));
    return sendSuccess(res, { message: "Departure deleted" });
  },
  availability: async (req, res) => sendSuccess(res,
    await service.availability(positiveInt(req.params.id, "id")))
};
