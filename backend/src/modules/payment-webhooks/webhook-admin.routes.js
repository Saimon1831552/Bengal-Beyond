const express=require('express');
const controller=require('./webhook.controller');
const router=express.Router();
// Mount behind staff authentication and payments.manage authorization.
router.get('/events',controller.list);
router.post('/events/:eventId/retry',controller.retry);
module.exports=router;
