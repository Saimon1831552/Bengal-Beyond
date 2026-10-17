const express = require("express");
const controller = require("./admin-customer.controller");
const asyncHandler = require("../../utils/asynchandler");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("customers.read"), asyncHandler(controller.list));
router.get("/:id", authorize("customers.read"), asyncHandler(controller.getById));
router.patch("/:id/status", authorize("customers.suspend"), asyncHandler(controller.updateStatus));

module.exports = router;
