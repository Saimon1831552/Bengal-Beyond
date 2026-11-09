const router = require('express').Router();
const controller = require('./refund.controller');
// Mount behind staff authentication and refunds.manage permission middleware.
router.get('/', controller.adminList);
router.post('/payments/:paymentId', controller.create);
router.patch('/:refundId', controller.update);
module.exports = router;
