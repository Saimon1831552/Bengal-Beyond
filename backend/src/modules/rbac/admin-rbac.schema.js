const { z } = require("zod");
const { paginationQuery } = require("../../validators/common");

const permissionKeys = z.array(z.string().trim().min(1).max(100)).max(100).refine(
  (keys) => new Set(keys).size === keys.length,
  "Permission keys must be unique.",
);

const roleBody = z.object({
  key: z.string().trim().min(2).max(50).regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(255).nullable().optional(),
  permissions: permissionKeys,
}).strict();

const roleUpdateBody = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(255).nullable().optional(),
}).strict().refine((body) => Object.keys(body).length > 0, "Provide at least one field to update.");

const roleListQuery = paginationQuery.extend({
  search: z.string().trim().min(1).max(160).optional(),
}).strict();

const roleParams = z.object({ id: z.coerce.number().int().positive() });
const roleUserParams = roleParams.extend({ userId: z.coerce.number().int().positive() });
const rolePermissionsBody = z.object({ permissions: permissionKeys }).strict();

module.exports = {
  roleParams,
  roleUserParams,
  roleBody,
  roleUpdateBody,
  rolePermissionsBody,
  roleListQuery,
};
