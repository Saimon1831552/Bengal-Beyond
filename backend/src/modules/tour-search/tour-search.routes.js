const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./tour-search.controller");
const router = express.Router();

router.get("/search", asyncHandler(controller.search));
module.exports = router;
