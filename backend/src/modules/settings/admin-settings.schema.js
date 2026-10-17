const { z } = require("zod");
const { paginationQuery } = require("../../validators/common");

const categories = ["general", "contact", "booking", "operations"];
const settingKeys = [
  "site_name",
  "support_email",
  "support_phone",
  "support_url",
  "default_currency",
  "booking_cancellation_enabled",
  "booking_cancellation_window_hours",
  "booking_cancellation_fee_percent",
  "max_booking_party_size",
  "maintenance_mode",
  "maintenance_message",
];

const listQuery = z.object({
  category: z.enum(categories).optional(),
  search: z.string().trim().min(1).max(100).optional(),
}).strict();

const historyQuery = paginationQuery.extend({
  key: z.enum(settingKeys).optional(),
}).strict();

const idKeyParams = z.object({
  key: z.enum(settingKeys),
});

const updateBody = z.object({
  value: z.unknown().refine((value) => value !== undefined, "value is required."),
  reason: z.string().trim().max(500).optional(),
}).strict();

const bulkUpdateBody = z.object({
  settings: z.record(z.string(), z.unknown()).refine(
    (settings) => Object.keys(settings).length > 0,
    "Provide at least one setting.",
  ),
  reason: z.string().trim().max(500).optional(),
}).strict();

module.exports = { listQuery, historyQuery, idKeyParams, updateBody, bulkUpdateBody };
