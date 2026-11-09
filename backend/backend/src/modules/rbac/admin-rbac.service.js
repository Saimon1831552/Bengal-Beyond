const AppError = require("../../utils/appError");
const repository = require("./admin-rbac.repository");

const PROTECTED_ROLE_KEYS = new Set(["super_admin", "customer"]);

async function listRoles(query) {
  const result = await repository.listRoles(query);
  return {
    ...result,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
}

async function listPermissions() {
  return repository.listPermissions();
}

async function getRole(id) {
  const role = await repository.findRole(id);
  if (!role) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  return { ...role, isSystem: PROTECTED_ROLE_KEYS.has(role.role_key) };
}

async function listRoleUsers(roleId, query) {
  const role = await repository.findRole(roleId);
  if (!role) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  const result = await repository.listUsersForRole(roleId, query);
  return {
    ...result,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
}

async function getActorAccess(actorId) {
  return repository.getActorAccess(actorId);
}

function assertAllowedPermissionGrants(keys, actorAccess) {
  const outsideScope = keys.filter((key) => !actorAccess.permissions.has(key));
  if (outsideScope.length) {
    throw AppError.forbidden(
      "You cannot grant permissions that you do not hold.",
      "PERMISSION_GRANT_OUT_OF_SCOPE",
    );
  }
  if (keys.includes("roles.manage") && !actorAccess.isSuperAdmin) {
    throw AppError.forbidden(
      "Only a Super Admin can delegate role-management access.",
      "SUPER_ADMIN_REQUIRED",
    );
  }
}

async function getPermissionIds(keys, actorAccess) {
  assertAllowedPermissionGrants(keys, actorAccess);
  const rows = await repository.resolvePermissionIds(keys);
  if (rows.length !== keys.length) {
    const knownKeys = new Set(rows.map((row) => row.permission_key));
    const unknown = keys.filter((key) => !knownKeys.has(key));
    throw AppError.badRequest(`Unknown permission key: ${unknown.join(", ")}.`, undefined, "UNKNOWN_PERMISSION");
  }
  return new Map(rows.map((row) => [row.permission_key, row.id]));
}

async function createRole(input, actorId, request) {
  if (PROTECTED_ROLE_KEYS.has(input.key)) {
    throw AppError.badRequest("This role key is reserved.", undefined, "PROTECTED_ROLE");
  }
  const actorAccess = await repository.getActorAccess(actorId);
  const permissionIds = await getPermissionIds(input.permissions, actorAccess);
  try {
    return await repository.createRole({
      ...input,
      permissionIds: input.permissions.map((key) => permissionIds.get(key)),
      permissionKeys: input.permissions,
      actorId,
      request,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw AppError.conflict("A role with this key already exists.", undefined, "ROLE_KEY_EXISTS");
    }
    throw error;
  }
}

async function updateRole(id, input, actorId, request) {
  const role = await repository.findRole(id);
  if (!role) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  if (PROTECTED_ROLE_KEYS.has(role.role_key)) {
    throw AppError.conflict("This system role cannot be modified.", undefined, "PROTECTED_ROLE");
  }
  return repository.updateRole({
    id,
    ...input,
    actorId,
    request,
  });
}

async function replaceRolePermissions(id, permissions, actorId, request) {
  const role = await repository.findRole(id);
  if (!role) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  if (PROTECTED_ROLE_KEYS.has(role.role_key)) {
    throw AppError.conflict("System role permissions cannot be modified.", undefined, "PROTECTED_ROLE");
  }
  const actorAccess = await repository.getActorAccess(actorId);
  const permissionIds = await getPermissionIds(permissions, actorAccess);
  return repository.replaceRolePermissions({
    id,
    permissionIds: permissions.map((key) => permissionIds.get(key)),
    permissionKeys: permissions,
    actorId,
    request,
  });
}

async function assignRoleToUser(roleId, userId, actorId, request) {
  if (userId === Number(actorId)) {
    throw AppError.conflict("You cannot change your own role assignments.", undefined, "SELF_ROLE_ASSIGNMENT");
  }
  const role = await repository.findRole(roleId);
  if (!role) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  if (PROTECTED_ROLE_KEYS.has(role.role_key)) {
    throw AppError.conflict("System roles cannot be assigned through this endpoint.", undefined, "PROTECTED_ROLE");
  }
  const actorAccess = await repository.getActorAccess(actorId);
  assertAllowedPermissionGrants(role.permissions, actorAccess);
  const result = await repository.assignRoleToUser({ roleId, userId, actorId, request });
  if (result === false) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  if (!result) throw AppError.notFound("Active user not found.", "USER_NOT_FOUND");
  return result;
}

async function removeRoleFromUser(roleId, userId, actorId, request) {
  if (userId === Number(actorId)) {
    throw AppError.conflict("You cannot change your own role assignments.", undefined, "SELF_ROLE_ASSIGNMENT");
  }
  const role = await repository.findRole(roleId);
  if (!role) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  if (PROTECTED_ROLE_KEYS.has(role.role_key)) {
    throw AppError.conflict("System role assignments cannot be removed through this endpoint.", undefined, "PROTECTED_ROLE");
  }
  const actorAccess = await repository.getActorAccess(actorId);
  assertAllowedPermissionGrants(role.permissions, actorAccess);
  const result = await repository.removeRoleFromUser({ roleId, userId, actorId, request });
  if (result === false) throw AppError.notFound("Role not found.", "ROLE_NOT_FOUND");
  if (!result) throw AppError.notFound("Role assignment not found.", "ROLE_ASSIGNMENT_NOT_FOUND");
  return result;
}

module.exports = {
  listRoles,
  listPermissions,
  getRole,
  listRoleUsers,
  createRole,
  updateRole,
  replaceRolePermissions,
  assignRoleToUser,
  removeRoleFromUser,
};
