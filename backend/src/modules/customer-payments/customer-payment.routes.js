const express = require("express");
const controller = require("./customer-payment.controller");
const router = express.Router();

router.get("/payments", controller.listPayments);
router.get("/payments/:paymentId", controller.getPayment);
router.post("/bookings/:bookingId/payments", controller.initiatePayment);

module.exports = router;
