const express = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const { paginationQuery } = require("../../validators/common");
const service = require("./cancellation.service");

const router = express.Router();
const listQuery = paginationQuery.extend({ status: z.enum(["pending", "approved", "rejected", "withdrawn"]).optional() }).strict();
const idParams = z.object({ id: z.coerce.number().int().positive() });
const body = z.object({ note: z.string().trim().max(1000).optional() }).strict();

router.get("/", validate({ query: listQuery }), asyncHandler(async (req, res) => {
  const { page, limit, status } = req.validated.query;
  const r = await service.list({ page, limit, status });
  return sendSuccess(res, r.rows, { meta: { page, limit, total: r.total, totalPages: Math.max(1, Math.ceil(r.total / limit)) } });
}));
for (const action of ["approve", "reject"]) {
  router.post(`/:id/${action}`, validate({ params: idParams, body }), asyncHandler(async (req, res) =>
    sendSuccess(res, await service.decide(req.validated.params.id, req.auth.userId, action, req.validated.body.note))));
}
module.exports = router;