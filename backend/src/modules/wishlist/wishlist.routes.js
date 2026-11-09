const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./wishlist.controller");
const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.post("/:tourId", asyncHandler(controller.add));
router.delete("/:tourId", asyncHandler(controller.remove));
router.get("/:tourId/status", asyncHandler(controller.contains));

module.exports = router;
