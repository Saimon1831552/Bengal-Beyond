const { z } = require("zod");
const { paginationQuery } = require("../../validators/common");

const notificationListQuery = paginationQuery.extend({
  unreadOnly: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
}).strict();

const activityQuery = paginationQuery.extend({
  entityType: z.string().trim().min(1).max(80).optional(),
}).strict();

const idParams = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = { notificationListQuery, activityQuery, idParams };
