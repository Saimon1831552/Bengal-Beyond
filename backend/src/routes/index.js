const express = require("express");

const router = express.Router();

router.use("/health", require("./Health.routes"));

// Phase 1 onwards, e.g.:
 router.use("/auth", require("../modules/auth/auth.routes"));
 router.use("/tours", require("../modules/tours/tour.routes"));
 router.use("/admin/tours",require("../modules/tours/admin-tour.routes"));
 

module.exports = router;