const express = require("express");
const controller = require("./customer-booking.controller");

const router = express.Router();

router.get("/bookings", controller.listBookings);
router.get("/bookings/:bookingId", controller.getBooking);
router.put("/bookings/:bookingId/travelers", controller.replaceTravelers);
router.patch("/bookings/:bookingId/special-requests", controller.updateSpecialRequests);
router.post("/bookings/:bookingId/cancellation-request", controller.requestCancellation);

module.exports = router;
