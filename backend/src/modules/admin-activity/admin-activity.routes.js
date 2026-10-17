const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asynchandler");
const {
  notificationListQuery,
  activityQuery,
  idParams,
} = require("./admin-activity.schema");
const controller = require("./admin-activity.controller");

const router = express.Router();
router.use(authenticate);

router.get(
  "/notifications/unread-count",
  authorize("notifications.read"),
  asyncHandler(controller.unreadCount),
);
router.get(
  "/notifications",
  authorize("notifications.read"),
  validate({ query: notificationListQuery }),
  asyncHandler(controller.listNotifications),
);
router.patch(
  "/notifications/read-all",
  authorize("notifications.read"),
  asyncHandler(controller.markAllNotificationsRead),
);
router.patch(
  "/notifications/:id/read",
  authorize("notifications.read"),
  validate({ params: idParams }),
  asyncHandler(controller.markNotificationRead),
);
router.get(
  "/activity",
  authorize("audit.read"),
  validate({ query: activityQuery }),
  asyncHandler(controller.listActivity),
);

module.exports = router;
