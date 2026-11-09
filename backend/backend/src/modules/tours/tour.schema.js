const { z } = require("zod");
const { idParams, paginationQuery } = require("../../validators/common");

const listQuery = paginationQuery.extend({
  q: z.string().trim().max(120).optional(),
  destination: z.string().trim().max(160).optional(),
  minDays: z.coerce.number().int().min(1).max(365).optional(),
  maxDays: z.coerce.number().int().min(1).max(365).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "duration_asc", "duration_desc", "title"]).default("newest"),
}).refine((v) => v.minDays === undefined || v.maxDays === undefined || v.minDays <= v.maxDays, { message: "minDays must be less than or equal to maxDays", path: ["minDays"] })
 .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, { message: "minPrice must be less than or equal to maxPrice", path: ["minPrice"] });

const slugParams = z.object({ slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) });
module.exports = { listQuery, slugParams };
