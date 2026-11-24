const express = require('express');
const controller = require('./sslcommerz.controller');
const router = express.Router();

// Browser return callbacks only; IPN is handled durably at /api/webhooks/sslcommerz/ipn
const formBody = express.urlencoded({ extended: false, limit: '32kb' });
router.post('/success', formBody, controller.success);
router.post('/fail', formBody, controller.fail);
router.post('/cancel', formBody, controller.cancel);

module.exports = router;