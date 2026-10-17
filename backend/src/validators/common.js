const { z } = require("zod");

// :id route params arrive as strings, so coerce.
const idParams = z.object({
  id: z.coerce.number().int().positive(),
});

// ?page=2&limit=20
const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = { idParams, paginationQuery };