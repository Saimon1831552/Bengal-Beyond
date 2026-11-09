const express = require("express");
const controller = require("./pricing.controller");
const router = express.Router();

router.get("/:bookingId/pricing", controller.getPricing);
router.post("/:bookingId/coupon", controller.applyCoupon);
router.delete("/:bookingId/coupon", controller.removeCoupon);

module.exports = router;
