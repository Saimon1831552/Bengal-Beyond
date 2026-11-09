const express = require("express");
const controller = require("./support.controller");
const router = express.Router();

router.get("/", controller.listAdmin);
router.get("/:ticketId", controller.getAdmin);
router.patch("/:ticketId", controller.updateAdmin);
router.post("/:ticketId/messages", controller.replyAdmin);
module.exports = router;
