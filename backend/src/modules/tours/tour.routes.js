const express = require("express");
const validate = require("../../middleware/validate");
const controller = require("./tour.controller");
const { listQuery, slugParams } = require("./tour.schema");

const router = express.Router();
router.get("/", validate({ query: listQuery }), controller.list);
router.get("/:slug", validate({ params: slugParams }), controller.getBySlug);
module.exports = router;
