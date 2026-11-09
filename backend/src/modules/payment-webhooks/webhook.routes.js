const express=require('express');
const controller=require('./webhook.controller');
const router=express.Router();
// Public gateway ingress: payload is durably recorded before processing.
// Do not add customer/staff auth here; secure with TLS, payload validation and rate limits.
router.post('/sslcommerz/ipn',express.urlencoded({extended:false,limit:'32kb'}),controller.receive);
module.exports=router;
