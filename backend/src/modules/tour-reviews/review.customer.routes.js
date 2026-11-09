const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./review.controller");
const router = express.Router();

router.post("/tours/:tourId/reviews", asyncHandler(controller.submit));
module.exports = router;
