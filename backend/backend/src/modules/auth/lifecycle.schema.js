const { z } = require("zod");
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const token = z.string().trim().min(32).max(200);
const password = z.string().min(12).max(128);

module.exports = {
  emailBody: z.object({ email }).strict(),
  tokenBody: z.object({ token }).strict(),
  resetBody: z.object({ token, password }).strict(),
};
