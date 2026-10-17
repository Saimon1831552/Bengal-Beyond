const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./admin-settings.controller");
const {
  listQuery,
  historyQuery,
  idKeyParams,
  updateBody,
  bulkUpdateBody,
} = require("./admin-settings.schema");

const router = express.Router();
router.use(authenticate, authorize("settings.manage"));

router.get("/", validate({ query: listQuery }), asyncHandler(controller.list));
router.get("/history", validate({ query: historyQuery }), asyncHandler(controller.history));
router.put("/bulk", validate({ body: bulkUpdateBody }), asyncHandler(controller.bulkUpdate));
router.patch(
  "/:key",
  validate({ params: idKeyParams, body: updateBody }),
  asyncHandler(controller.update),
);

module.exports = router;
