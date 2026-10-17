const { test } = require("node:test");
const assert = require("node:assert/strict");
const repository = require("../../src/modules/admin-activity/admin-activity.repository");
const service = require("../../src/modules/admin-activity/admin-activity.service");
const { resourceLink } = require("../../src/modules/admin-activity/admin-activity.links");
const { activityQuery, notificationListQuery } = require("../../src/modules/admin-activity/admin-activity.schema");

test("notification and activity queries validate paging and filters", () => {
  assert.deepEqual(notificationListQuery.parse({ unreadOnly: "true", page: "2", limit: "10" }), {
    unreadOnly: true,
    page: 2,
    limit: 10,
  });
  assert.deepEqual(activityQuery.parse({ entityType: "payment" }), {
    page: 1,
    limit: 20,
    entityType: "payment",
  });
  assert.throws(() => notificationListQuery.parse({ unreadOnly: "yes" }));
  assert.throws(() => activityQuery.parse({ limit: "101" }));
});

test("notifications and activity entries link only to supported admin records", () => {
  assert.deepEqual(resourceLink("booking", 19), {
    type: "booking",
    id: "19",
    href: "/admin/bookings/19",
  });
  assert.deepEqual(resourceLink("payment", "20"), {
    type: "payment",
    id: "20",
    href: "/admin/payments/20",
  });
  assert.deepEqual(resourceLink("user", 21), {
    type: "customer",
    id: "21",
    href: "/admin/customers/21",
  });
  assert.equal(resourceLink("untrusted/path", 2), null);
  assert.equal(resourceLink("customer", "2/notes"), null);
});

test("listing admin notifications maps read state, links, unread count, and pagination", async (t) => {
  const original = repository.listNotifications;
  t.after(() => { repository.listNotifications = original; });
  repository.listNotifications = async () => ({
    items: [{
      id: 9,
      event_type: "booking.created",
      title: "New booking",
      message: "Review booking.",
      is_read: 0,
      created_at: "2026-10-17T00:00:00.000Z",
      read_at: null,
      entity_type: "booking",
      entity_id: 4,
    }],
    total: 1,
    unreadCount: 1,
  });

  const result = await service.listNotifications({
    userId: 7,
    page: 1,
    limit: 20,
    unreadOnly: false,
  });

  assert.equal(result.unreadCount, 1);
  assert.deepEqual(result.items[0].resource, {
    type: "booking",
    id: "4",
    href: "/admin/bookings/4",
  });
  assert.equal(result.items[0].isRead, false);
  assert.deepEqual(result.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 });
});

test("marking a notification read is idempotent and hides inaccessible notifications", async (t) => {
  const original = repository.markNotificationRead;
  t.after(() => { repository.markNotificationRead = original; });

  repository.markNotificationRead = async () => true;
  assert.deepEqual(await service.markNotificationRead({ notificationId: 2, userId: 7 }), {
    id: 2,
    isRead: true,
  });

  repository.markNotificationRead = async () => false;
  await assert.rejects(
    service.markNotificationRead({ notificationId: 999, userId: 7 }),
    (error) => error.code === "NOTIFICATION_NOT_FOUND",
  );
});

test("activity feed returns safe actor and entity links without audit payload fields", async (t) => {
  const original = repository.listActivity;
  t.after(() => { repository.listActivity = original; });
  repository.listActivity = async () => ({
    items: [{
      id: 4,
      actor_user_id: 7,
      actor_name: "Admin",
      action: "payment.admin_verify",
      entity_type: "payment",
      entity_id: 12,
      request_id: "request-1",
      created_at: "2026-10-17T00:00:00.000Z",
      before_data: '{"status":"pending"}',
    }],
    total: 1,
  });

  const result = await service.listActivity({ page: 1, limit: 10 });

  assert.deepEqual(result.items[0].resource, {
    type: "payment",
    id: "12",
    href: "/admin/payments/12",
  });
  assert.deepEqual(result.items[0].actor, { id: 7, name: "Admin" });
  assert.equal(Object.hasOwn(result.items[0], "before_data"), false);
  assert.deepEqual(result.pagination, { page: 1, limit: 10, total: 1, totalPages: 1 });
});
