const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./admin-audit.controller");
const { auditQuery, idParams } = require("./admin-audit.schema");

const router = express.Router();
router.use(authenticate);
router.use(authorize("audit.read"));
router.get("/", validate({ query: auditQuery }), asyncHandler(controller.listAuditLogs));
router.get("/security-events", validate({ query: auditQuery }), asyncHandler(controller.listSecurityEvents));
router.get("/summary", asyncHandler(controller.securitySummary));
router.get("/:id", validate({ params: idParams }), asyncHandler(controller.getAuditLog));

module.exports = router;
