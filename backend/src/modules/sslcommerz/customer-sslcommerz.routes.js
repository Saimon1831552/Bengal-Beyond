const express = require('express');
const controller = require('./sslcommerz.controller');
const router = express.Router();
router.post('/bookings/:bookingId/payments/sslcommerz', controller.initiate);
router.get('/payments/:paymentId', controller.getPayment);
module.exports = router;
