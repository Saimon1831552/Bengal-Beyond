const express = require("express");
const controller = require("./support.controller");
const router = express.Router();

// Public pre-sales/general enquiry form. Add rate limiting and CAPTCHA at the app boundary.
router.post("/enquiries", controller.createPublic);
module.exports = router;
