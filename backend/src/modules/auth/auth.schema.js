const { z } = require("zod");

const registerBody = z.object({
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  nationality: z.string().trim().max(100).optional().or(z.literal("")),
}).strict();

const loginBody = z.object({
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

module.exports = { registerBody, loginBody };
