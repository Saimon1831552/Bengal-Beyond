const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./review.controller");
const router = express.Router();

router.get("/", asyncHandler(controller.adminList));
router.patch("/:id", asyncHandler(controller.moderate));
module.exports = router;
