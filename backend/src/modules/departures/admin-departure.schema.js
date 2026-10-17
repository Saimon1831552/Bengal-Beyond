const { z } = require("zod");

const idParams = z.object({ id: z.coerce.number().int().positive() });
const dateTime = z.string().trim().min(1).max(30);
const departureFields = {
  tour_id: z.coerce.number().int().positive(),
  starts_at: dateTime,
  ends_at: dateTime.nullable().optional(),
  seat_capacity: z.coerce.number().int().min(1).max(100000),
  price_override: z.union([z.coerce.number().min(0).max(9999999999.99), z.null()]).optional(),
};
const createDepartureBody = z.object(departureFields).strict();
const updateDepartureBody = z.object({
  tour_id: departureFields.tour_id.optional(),
  starts_at: dateTime.optional(),
  ends_at: dateTime.nullable().optional(),
  seat_capacity: departureFields.seat_capacity.optional(),
  price_override: departureFields.price_override,
}).strict().refine((body) => Object.keys(body).length > 0, { message: "At least one field is required" });
const statusBody = z.object({ status: z.enum(["scheduled", "cancelled", "completed"]) }).strict();
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tour_id: z.coerce.number().int().positive().optional(),
  status: z.enum(["scheduled", "sold_out", "cancelled", "completed"]).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
}).strict().refine((q) => !q.from || !q.to || q.from <= q.to, { message: "from must be on or before to" });
module.exports = { idParams, createDepartureBody, updateDepartureBody, statusBody, listQuery };
