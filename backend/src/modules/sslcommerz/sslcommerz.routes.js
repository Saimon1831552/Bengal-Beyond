const express = require('express');
const controller = require('./sslcommerz.controller');
const router = express.Router();

// SSLCommerz sends application/x-www-form-urlencoded IPN and return payloads.
const formBody = express.urlencoded({ extended: false, limit: '32kb' });
router.post('/ipn', formBody, controller.ipn);
router.post('/success', formBody, controller.success);
router.post('/fail', formBody, controller.fail);
router.post('/cancel', formBody, controller.cancel);

module.exports = router;
