const express = require("express");
const controller = require("./notification.admin.controller");
const router = express.Router();
router.get("/jobs", controller.listJobs);
router.post("/templates", controller.upsertTemplate);
router.post("/jobs/:jobId/retry", controller.retryJob);
module.exports = router;
