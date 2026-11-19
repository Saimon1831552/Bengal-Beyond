const express = require("express");
const controller = require("./booking.controller");
const optionalAuthenticate = require("../../middleware/optionalAuthenticate");
const { bookingCreate } = require("../../middleware/apiRateLimit");
const router = express.Router();
router.post("/", bookingCreate, optionalAuthenticate, controller.createBooking);
module.exports = router;
