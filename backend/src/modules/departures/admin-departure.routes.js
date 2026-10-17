const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const controller = require("./admin-departure.controller");
const schema = require("./admin-departure.schema");

const router = express.Router();
router.use(authenticate, authorize("departures.manage"));
router.get("/", validate({ query: schema.listQuery }), controller.list);
router.post("/", validate({ body: schema.createDepartureBody }), controller.create);
router.get("/:id", validate({ params: schema.idParams }), controller.get);
router.patch("/:id", validate({ params: schema.idParams, body: schema.updateDepartureBody }), controller.update);
router.patch("/:id/status", validate({ params: schema.idParams, body: schema.statusBody }), controller.changeStatus);
router.delete("/:id", validate({ params: schema.idParams }), controller.remove);
module.exports = router;
