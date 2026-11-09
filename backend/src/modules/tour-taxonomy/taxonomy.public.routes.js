const express = require("express");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./taxonomy.controller");
const router = express.Router();

router.get("/categories", asyncHandler(controller.categories.list));
router.get("/categories/:id", asyncHandler(controller.categories.get));
router.get("/tags", asyncHandler(controller.tags.list));
router.get("/tags/:id", asyncHandler(controller.tags.get));
router.get("/tours/:tourId/taxonomy", asyncHandler(controller.tourTaxonomy));

module.exports = router;
