const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asynchandler");
const { query } = require("./dashboard.schema");
const controller = require("./dashboard.controller");

const router = express.Router();

router.use(authenticate, authorize("dashboard.read"));
router.get("/", validate({ query }), asyncHandler(controller.getDashboard));

module.exports = router;
