const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./review.controller");
const router = express.Router();

router.get("/tours/:tourId/reviews", asyncHandler(controller.list));
module.exports = router;
