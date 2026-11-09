const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./departure.controller");
const router = express.Router();

router.post("/", asyncHandler(controller.create));
router.patch("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));
module.exports = router;
