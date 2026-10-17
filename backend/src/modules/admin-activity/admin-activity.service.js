const AppError = require("../../utils/appError");
const repository = require("./admin-activity.repository");
const { resourceLink } = require("./admin-activity.links");
const { paginationMeta } = require("../../utils/pagination");

async function listNotifications({ userId, page, limit, unreadOnly }) {
  const result = await repository.listNotifications({ userId, page, limit, unreadOnly });
  return {
    items: result.items.map((notification) => ({
      id: notification.id,
      eventType: notification.event_type,
      title: notification.title,
      message: notification.message,
      isRead: Boolean(notification.is_read),
      createdAt: notification.created_at,
      readAt: notification.read_at,
      resource: resourceLink(notification.entity_type, notification.entity_id),
    })),
    unreadCount: result.unreadCount,
    pagination: paginationMeta({ page, limit, total: result.total }),
  };
}

async function markNotificationRead({ notificationId, userId }) {
  const updated = await repository.markNotificationRead({ notificationId, userId });
  if (!updated) throw AppError.notFound("Notification not found.", "NOTIFICATION_NOT_FOUND");
  return { id: notificationId, isRead: true };
}

async function markAllNotificationsRead(userId) {
  const updatedCount = await repository.markAllNotificationsRead(userId);
  return { updatedCount };
}

async function unreadCount(userId) {
  return { unreadCount: await repository.unreadCount(userId) };
}

async function listActivity({ page, limit, entityType }) {
  const result = await repository.listActivity({ page, limit, entityType });
  return {
    items: result.items.map((activity) => ({
      id: activity.id,
      action: activity.action,
      actor: activity.actor_user_id
        ? { id: activity.actor_user_id, name: activity.actor_name }
        : null,
      entityType: activity.entity_type,
      entityId: activity.entity_id,
      createdAt: activity.created_at,
      requestId: activity.request_id,
      resource: resourceLink(activity.entity_type, activity.entity_id),
    })),
    pagination: paginationMeta({ page, limit, total: result.total }),
  };
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  unreadCount,
  listActivity,
};
