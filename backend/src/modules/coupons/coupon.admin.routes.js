const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./coupon.controller");
const router = express.Router();

router.get("/", asyncHandler(controller.adminList));
router.get("/:id", asyncHandler(controller.get));
router.post("/", asyncHandler(controller.create));
router.patch("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));
module.exports = router;
