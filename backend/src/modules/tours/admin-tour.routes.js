const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const controller = require("./admin-tour.controller");
const { idParams, createTourBody, updateTourBody, statusBody } = require("./admin-tour.schema");

const router = express.Router();
router.use(authenticate, authorize("tours.manage"));
router.post("/", validate({ body: createTourBody }), controller.create);
router.patch("/:id", validate({ params: idParams, body: updateTourBody }), controller.update);
router.patch("/:id/status", validate({ params: idParams, body: statusBody }), controller.changeStatus);
router.delete("/:id", validate({ params: idParams }), controller.remove);
module.exports = router;
