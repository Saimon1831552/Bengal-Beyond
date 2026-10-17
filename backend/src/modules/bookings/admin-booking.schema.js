const { z } = require("zod");

const statuses = ["pending_review", "awaiting_payment", "confirmed", "rejected", "cancellation_requested", "cancelled", "completed", "expired"];
const paymentStatuses = ["not_required", "unpaid", "pending", "paid", "partially_refunded", "refunded", "failed"];

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(160).optional(),
  status: z.enum(statuses).optional(),
  payment_status: z.enum(paymentStatuses).optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  departure_id: z.coerce.number().int().positive().optional(),
  sort: z.enum(["created_at", "updated_at", "total_amount"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
}).refine((v) => !v.date_from || !v.date_to || v.date_from <= v.date_to, { message: "date_from must be on or before date_to" });

const statusBody = z.object({
  status: z.enum(statuses),
  note: z.string().trim().max(1000).optional(),
}).strict();

const noteBody = z.object({
  note: z.string().trim().min(1).max(5000),
  visibility: z.enum(["internal", "customer_visible"]).default("internal"),
}).strict();

module.exports = { listQuery, statusBody, noteBody };
