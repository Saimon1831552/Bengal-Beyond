const { sendSuccess } = require("../../utils/response");
const service = require("./admin-activity.service");

async function listNotifications(req, res) {
  return sendSuccess(res, await service.listNotifications({
    userId: req.auth.userId,
    ...req.validated.query,
  }));
}

async function markNotificationRead(req, res) {
  return sendSuccess(res, await service.markNotificationRead({
    notificationId: req.validated.params.id,
    userId: req.auth.userId,
  }));
}

async function markAllNotificationsRead(req, res) {
  return sendSuccess(res, await service.markAllNotificationsRead(req.auth.userId));
}

async function unreadCount(req, res) {
  return sendSuccess(res, await service.unreadCount(req.auth.userId));
}

async function listActivity(req, res) {
  return sendSuccess(res, await service.listActivity(req.validated.query));
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  unreadCount,
  listActivity,
};
