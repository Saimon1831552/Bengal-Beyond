const { z } = require("zod");

const query = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
}).strict();

module.exports = { query };
