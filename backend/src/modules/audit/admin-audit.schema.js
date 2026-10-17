const { z } = require("zod");
const { paginationQuery, idParams } = require("../../validators/common");

const validDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Must be a valid date or ISO datetime.",
});

const auditQuery = paginationQuery.extend({
  actorId: z.coerce.number().int().positive().optional(),
  from: validDate.optional(),
  to: validDate.optional(),
  action: z.string().trim().min(1).max(120).optional(),
  entityType: z.string().trim().min(1).max(80).optional(),
  entityId: z.coerce.number().int().positive().optional(),
  requestId: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(160).optional(),
}).strict();

module.exports = { auditQuery, idParams };
