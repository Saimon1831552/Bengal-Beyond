const express = require("express");
const controller = require("./booking.controller");
const authenticate = require("../../middleware/authenticate");
const router = express.Router();
router.post("/", authenticate, controller.createBooking);
module.exports = router;
