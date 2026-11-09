const express = require("express");
const controller = require("./admin-payment.controller");
const asyncHandler = require("../../utils/asynchandler");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("payments.read"), asyncHandler(controller.list));
router.get("/:id", authorize("payments.read"), asyncHandler(controller.getById));
router.post("/:id/verify", authorize("payments.manage"), asyncHandler(controller.verify));
router.post("/:id/mark-failed", authorize("payments.manage"), asyncHandler(controller.markFailed));

module.exports = router;
