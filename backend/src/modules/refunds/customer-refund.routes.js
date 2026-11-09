const router = require('express').Router();
const controller = require('./refund.controller');
// Mount behind customer authentication; req.user.id must be set.
router.get('/', controller.customerList);
module.exports = router;
