const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const authenticate = require("../../middleware/authenticate");
const controller = require("./review.controller");
const router = express.Router();

router.post("/tours/:tourId/reviews", authenticate, asyncHandler(controller.submit));
module.exports = router;
