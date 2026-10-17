const { test } = require("node:test");
const assert = require("node:assert/strict");
const repository = require("../../src/modules/rbac/admin-rbac.repository");
const service = require("../../src/modules/rbac/admin-rbac.service");
const {
  roleBody,
  roleUpdateBody,
  rolePermissionsBody,
  roleListQuery,
} = require("../../src/modules/rbac/admin-rbac.schema");

test("RBAC request schemas validate role keys, permission lists, and assignment paging", () => {
  assert.deepEqual(roleBody.parse({
    key: "booking_viewer",
    name: "Booking Viewer",
    permissions: ["bookings.read"],
  }), {
    key: "booking_viewer",
    name: "Booking Viewer",
    permissions: ["bookings.read"],
  });
  assert.throws(() => roleBody.parse({ key: "Super Admin", name: "Role", permissions: [] }));
  assert.throws(() => roleBody.parse({ key: "viewer", name: "Viewer", permissions: ["x", "x"] }));
  assert.throws(() => roleUpdateBody.parse({}));
  assert.throws(() => roleUpdateBody.parse({ permissions: ["bookings.read"] }));
  assert.throws(() => rolePermissionsBody.parse({ permissions: ["x", "x"] }));
  assert.deepEqual(roleListQuery.parse({ search: "manager", page: "2" }), {
    search: "manager",
    page: 2,
    limit: 20,
  });
});

test("role creation accepts only permissions held by the actor", async (t) => {
  const originals = {
    getActorAccess: repository.getActorAccess,
    resolvePermissionIds: repository.resolvePermissionIds,
    createRole: repository.createRole,
  };
  t.after(() => Object.assign(repository, originals));

  repository.getActorAccess = async () => ({
    isSuperAdmin: false,
    permissions: new Set(["roles.manage", "bookings.read"]),
  });
  repository.resolvePermissionIds = async () => [{ id: 2, permission_key: "bookings.read" }];
  repository.createRole = async (input) => input;

  const created = await service.createRole({
    key: "booking_viewer",
    name: "Booking Viewer",
    permissions: ["bookings.read"],
  }, 10, {});
  assert.deepEqual(created.permissionIds, [2]);
  assert.deepEqual(created.permissionKeys, ["bookings.read"]);
  await assert.rejects(
    service.createRole({
      key: "payment_admin",
      name: "Payment Admin",
      permissions: ["payments.manage"],
    }, 10, {}),
    (error) => error.code === "PERMISSION_GRANT_OUT_OF_SCOPE",
  );
});

test("only Super Admin can delegate role management or modify system roles", async (t) => {
  const originals = {
    getActorAccess: repository.getActorAccess,
    resolvePermissionIds: repository.resolvePermissionIds,
    findRole: repository.findRole,
  };
  t.after(() => Object.assign(repository, originals));
  repository.getActorAccess = async () => ({
    isSuperAdmin: false,
    permissions: new Set(["roles.manage"]),
  });
  repository.resolvePermissionIds = async () => [{ id: 21, permission_key: "roles.manage" }];
  repository.findRole = async () => ({
    id: 1,
    role_key: "super_admin",
    permissions: ["roles.manage"],
  });

  await assert.rejects(
    service.createRole({
      key: "delegated_manager",
      name: "Delegated Manager",
      permissions: ["roles.manage"],
    }, 10, {}),
    (error) => error.code === "SUPER_ADMIN_REQUIRED",
  );
  await assert.rejects(
    service.updateRole(1, { name: "Changed" }, 10, {}),
    (error) => error.code === "PROTECTED_ROLE",
  );
});

test("role assignment cannot target self, system roles, or out-of-scope grants", async (t) => {
  const originals = {
    getActorAccess: repository.getActorAccess,
    findRole: repository.findRole,
    assignRoleToUser: repository.assignRoleToUser,
    removeRoleFromUser: repository.removeRoleFromUser,
  };
  t.after(() => Object.assign(repository, originals));
  repository.getActorAccess = async () => ({
    isSuperAdmin: false,
    permissions: new Set(["roles.manage", "bookings.read"]),
  });
  repository.findRole = async (id) => id === 1
    ? { id: 1, role_key: "super_admin", permissions: ["roles.manage"] }
    : { id, role_key: "payments_manager", permissions: ["payments.manage"] };
  repository.assignRoleToUser = async () => ({ userId: 11, roleId: 2 });
  repository.removeRoleFromUser = async () => ({ userId: 11, roleId: 2, removed: true });

  await assert.rejects(
    service.assignRoleToUser(2, 10, 10, {}),
    (error) => error.code === "SELF_ROLE_ASSIGNMENT",
  );
  await assert.rejects(
    service.assignRoleToUser(1, 11, 10, {}),
    (error) => error.code === "PROTECTED_ROLE",
  );
  await assert.rejects(
    service.assignRoleToUser(2, 11, 10, {}),
    (error) => error.code === "PERMISSION_GRANT_OUT_OF_SCOPE",
  );
});

test("single-role assignment and removal require manager scope and cannot target self", async (t) => {
  const originals = {
    getActorAccess: repository.getActorAccess,
    findRole: repository.findRole,
    assignRoleToUser: repository.assignRoleToUser,
    removeRoleFromUser: repository.removeRoleFromUser,
  };
  t.after(() => Object.assign(repository, originals));

  repository.getActorAccess = async () => ({
    isSuperAdmin: false,
    permissions: new Set(["roles.manage", "bookings.read"]),
  });
  repository.findRole = async () => ({
    id: 8,
    role_key: "booking_viewer",
    permissions: ["bookings.read"],
  });
  repository.assignRoleToUser = async () => ({ userId: 25, roleId: 8 });
  repository.removeRoleFromUser = async () => ({ userId: 25, roleId: 8, removed: true });

  assert.deepEqual(await service.assignRoleToUser(8, 25, 10, {}), { userId: 25, roleId: 8 });
  assert.deepEqual(await service.removeRoleFromUser(8, 25, 10, {}), {
    userId: 25,
    roleId: 8,
    removed: true,
  });
  await assert.rejects(
    service.removeRoleFromUser(8, 10, 10, {}),
    (error) => error.code === "SELF_ROLE_ASSIGNMENT",
  );
});
