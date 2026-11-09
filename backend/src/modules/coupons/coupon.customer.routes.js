const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./coupon.controller");
const router = express.Router();

router.post("/validate", asyncHandler(controller.validate));
module.exports = router;
