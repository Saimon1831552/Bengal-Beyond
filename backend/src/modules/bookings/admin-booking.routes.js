const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./admin-booking.controller");
const router = express.Router();

router.use(authenticate);
router.get("/", authorize("bookings.read"), controller.list);
router.get("/:id", authorize("bookings.read"), controller.get);
router.patch("/:id/status", authorize("bookings.manage"), controller.changeStatus);
router.post("/:id/notes", authorize("bookings.manage"), controller.addNote);
module.exports = router;
