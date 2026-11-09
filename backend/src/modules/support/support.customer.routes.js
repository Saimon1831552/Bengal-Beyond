const express = require("express");
const controller = require("./support.controller");
const router = express.Router();

router.post("/", controller.createCustomer);
router.get("/", controller.listCustomer);
router.get("/:ticketId", controller.getCustomer);
router.post("/:ticketId/messages", controller.replyCustomer);
module.exports = router;
