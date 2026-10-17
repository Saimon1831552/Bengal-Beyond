const { z } = require("zod");
const { idParams } = require("../../validators/common");

const slug = z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");
const money = z.coerce.number().finite().min(0).max(9999999999.99);

const tourFields = {
  slug: slug.optional(),
  title: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(100000).nullable().optional(),
  destination: z.string().trim().min(1).max(160),
  duration_days: z.coerce.number().int().min(1).max(365),
  base_price: money,
  currency_code: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("USD"),
  cover_image_url: z.string().trim().url().max(1024).nullable().optional(),
  cancellation_policy: z.string().trim().max(20000).nullable().optional(),
};

const createTourBody = z.object(tourFields).strict();
const updateTourBody = z.object({
  slug: slug.optional(),
  title: tourFields.title.optional(),
  summary: tourFields.summary,
  description: tourFields.description,
  destination: tourFields.destination.optional(),
  duration_days: tourFields.duration_days.optional(),
  base_price: tourFields.base_price.optional(),
  currency_code: tourFields.currency_code.optional(),
  cover_image_url: tourFields.cover_image_url,
  cancellation_policy: tourFields.cancellation_policy,
}).strict().refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });
const statusBody = z.object({ status: z.enum(["draft", "published", "unpublished", "archived"]) }).strict();
module.exports = { idParams, createTourBody, updateTourBody, statusBody };
