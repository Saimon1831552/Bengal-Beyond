const { pool } = require("../../config/db");

async function listNotifications({ userId, page, limit, unreadOnly }) {
  const conditions = [
    `(recipient.notification_id IS NOT NULL OR NOT EXISTS (
       SELECT 1 FROM admin_notification_recipients assigned
        WHERE assigned.notification_id = notification.id
     ))`,
  ];
  const params = [userId];

  if (unreadOnly) conditions.push("COALESCE(recipient.is_read, 0) = 0");
  const where = conditions.join(" AND ");
  const offset = (page - 1) * limit;

  const [[countRows], [notificationRows], [unreadRows]] = await Promise.all([
    pool.execute(
      `SELECT COUNT(*) AS total
         FROM admin_notifications notification
         LEFT JOIN admin_notification_recipients recipient
           ON recipient.notification_id = notification.id
          AND recipient.recipient_user_id = ?
        WHERE ${where}`,
      params,
    ),
    pool.execute(
      `SELECT notification.id, notification.event_type, notification.title,
              notification.message, notification.entity_type, notification.entity_id,
              notification.created_at, COALESCE(recipient.is_read, 0) AS is_read,
              recipient.read_at
         FROM admin_notifications notification
         LEFT JOIN admin_notification_recipients recipient
           ON recipient.notification_id = notification.id
          AND recipient.recipient_user_id = ?
        WHERE ${where}
        ORDER BY notification.created_at DESC, notification.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    ),
    pool.execute(
      `SELECT COUNT(*) AS unread
         FROM admin_notifications notification
         LEFT JOIN admin_notification_recipients recipient
           ON recipient.notification_id = notification.id
          AND recipient.recipient_user_id = ?
        WHERE ${where} AND COALESCE(recipient.is_read, 0) = 0`,
      params,
    ),
  ]);

  return {
    items: notificationRows,
    total: Number(countRows[0].total),
    unreadCount: Number(unreadRows[0].unread),
  };
}

async function markNotificationRead({ notificationId, userId }) {
  const [visibleRows] = await pool.execute(
    `SELECT notification.id,
            NOT EXISTS (
              SELECT 1 FROM admin_notification_recipients assigned
               WHERE assigned.notification_id = notification.id
            ) AS is_global
       FROM admin_notifications notification
      WHERE notification.id = ?
        AND (
          NOT EXISTS (
            SELECT 1 FROM admin_notification_recipients assigned
             WHERE assigned.notification_id = notification.id
          )
          OR EXISTS (
            SELECT 1 FROM admin_notification_recipients own
             WHERE own.notification_id = notification.id
               AND own.recipient_user_id = ?
          )
        )
      LIMIT 1`,
    [notificationId, userId],
  );
  if (!visibleRows.length) return false;

  if (visibleRows[0].is_global) {
    await createGlobalNotificationRecipients({ userId, notificationId });
  } else {
    await pool.execute(
      `UPDATE admin_notification_recipients
          SET is_read = 1, read_at = COALESCE(read_at, UTC_TIMESTAMP())
        WHERE notification_id = ? AND recipient_user_id = ?`,
      [notificationId, userId],
    );
  }

  return true;
}

async function createGlobalNotificationRecipients({ userId, notificationId = null }) {
  const idClause = notificationId === null ? "" : "AND notification.id = ?";
  const params = notificationId === null
    ? [userId, userId]
    : [userId, userId, notificationId];
  await pool.execute(
    `INSERT INTO admin_notification_recipients
       (notification_id, recipient_user_id, is_read, read_at)
     SELECT notification.id, audience.user_id,
            IF(audience.user_id = ?, 1, 0),
            IF(audience.user_id = ?, UTC_TIMESTAMP(), NULL)
       FROM admin_notifications notification
       JOIN (
         SELECT DISTINCT user_role.user_id
           FROM user_roles user_role
           JOIN role_permissions role_permission ON role_permission.role_id = user_role.role_id
           JOIN permissions permission ON permission.id = role_permission.permission_id
           JOIN users active_user ON active_user.id = user_role.user_id
          WHERE permission.permission_key = 'notifications.read'
            AND active_user.account_status = 'active'
       ) audience
      WHERE NOT EXISTS (
        SELECT 1 FROM admin_notification_recipients assigned
         WHERE assigned.notification_id = notification.id
      )
      ${idClause}
     ON DUPLICATE KEY UPDATE
       is_read = VALUES(is_read),
       read_at = VALUES(read_at)`,
    params,
  );
}

async function markAllNotificationsRead(userId) {
  const countBefore = await unreadCount(userId);
  await createGlobalNotificationRecipients({ userId });
  const [result] = await pool.execute(
    `UPDATE admin_notification_recipients
        SET is_read = 1, read_at = COALESCE(read_at, UTC_TIMESTAMP())
      WHERE recipient_user_id = ? AND is_read = 0`,
    [userId],
  );
  return Math.max(countBefore, result.affectedRows);
}

async function unreadCount(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS unread
       FROM admin_notifications notification
       LEFT JOIN admin_notification_recipients recipient
         ON recipient.notification_id = notification.id
        AND recipient.recipient_user_id = ?
      WHERE COALESCE(recipient.is_read, 0) = 0
        AND (
          recipient.notification_id IS NOT NULL
          OR NOT EXISTS (
            SELECT 1 FROM admin_notification_recipients assigned
             WHERE assigned.notification_id = notification.id
          )
        )`,
    [userId],
  );
  return Number(rows[0].unread);
}

async function listActivity({ page, limit, entityType }) {
  const conditions = [];
  const params = [];
  if (entityType) {
    conditions.push("activity.entity_type = ?");
    params.push(entityType);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;
  const activitySource = `(
    SELECT CONCAT('audit:', log.id) AS id, log.actor_user_id, log.action,
           log.entity_type, log.entity_id, log.request_id, log.created_at
      FROM audit_logs log
    UNION ALL
    SELECT CONCAT('booking-status:', history.id) AS id, history.changed_by_user_id AS actor_user_id,
           CONCAT('booking.status.', history.new_status) AS action,
           'booking' AS entity_type, history.booking_id AS entity_id,
           NULL AS request_id, history.created_at
      FROM booking_status_history history
    UNION ALL
    SELECT CONCAT('booking-note:', note.id) AS id, note.admin_user_id AS actor_user_id,
           'booking.note_added' AS action, 'booking' AS entity_type,
           note.booking_id AS entity_id, NULL AS request_id, note.created_at
      FROM booking_notes note
  ) activity`;

  const [[countRows], [activityRows]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM ${activitySource} ${where}`, params),
    pool.execute(
      `SELECT activity.id, activity.actor_user_id, actor.full_name AS actor_name,
              activity.action, activity.entity_type, activity.entity_id,
              activity.request_id, activity.created_at
         FROM ${activitySource}
         LEFT JOIN users actor ON actor.id = activity.actor_user_id
         ${where}
        ORDER BY activity.created_at DESC, activity.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    ),
  ]);

  return { items: activityRows, total: Number(countRows[0].total) };
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  unreadCount,
  listActivity,
};
