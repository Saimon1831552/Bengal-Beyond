const express = require('express');
const controller = require('./sslcommerz-refund.controller');
const router = express.Router();

// Mount behind staff authentication and refunds.manage authorization.
router.post('/:refundId/sslcommerz/submit', controller.initiate);
router.post('/:refundId/sslcommerz/reconcile', controller.reconcile);
module.exports = router;
