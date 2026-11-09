const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./departure.controller");
const router = express.Router();

router.get("/tours/:tourId/departures", asyncHandler(controller.list));
router.get("/departures/:id/availability", asyncHandler(controller.availability));
module.exports = router;
