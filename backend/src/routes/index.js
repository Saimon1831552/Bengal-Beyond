const express = require("express");

const router = express.Router();

router.use("/health", require("./Health.routes"));

// Phase 1 onwards, e.g.:
 router.use("/auth", require("../modules/auth/auth.routes"));
 router.use("/tours", require("../modules/tours/tour.routes"));
 router.use("/admin/tours", require("../modules/tours/admin-tour.routes"));
 router.use("/admin/departures", require("../modules/departures/admin-departure.routes"));
 router.use("/admin/bookings", require("../modules/bookings/admin-booking.routes"));
 router.use("/admin/payments", require("../modules/payments/admin-payment.routes"));
 router.use("/admin/customers", require("../modules/customers/admin-customer.routes"));
 router.use("/admin/dashboard", require("../modules/dashboard/dashboard.routes"));
 router.use("/admin", require("../modules/admin-activity/admin-activity.routes"));
 router.use("/admin/settings", require("../modules/settings/admin-settings.routes"));
 

module.exports = router;