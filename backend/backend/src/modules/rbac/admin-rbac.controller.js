const { sendSuccess } = require("../../utils/response");
const service = require("./admin-rbac.service");

async function listRoles(req, res) {
  const result = await service.listRoles(req.validated.query);
  return sendSuccess(res, result.items, { meta: result.pagination });
}

async function listPermissions(_req, res) {
  return sendSuccess(res, await service.listPermissions());
}

async function getRole(req, res) {
  return sendSuccess(res, await service.getRole(req.validated.params.id));
}

async function createRole(req, res) {
  return sendSuccess(
    res,
    await service.createRole(req.validated.body, req.auth.userId, req),
    { status: 201 },
  );
}

async function updateRole(req, res) {
  return sendSuccess(
    res,
    await service.updateRole(
      req.validated.params.id,
      req.validated.body,
      req.auth.userId,
      req,
    ),
  );
}

async function replaceRolePermissions(req, res) {
  return sendSuccess(
    res,
    await service.replaceRolePermissions(
      req.validated.params.id,
      req.validated.body.permissions,
      req.auth.userId,
      req,
    ),
  );
}

async function listRoleUsers(req, res) {
  const result = await service.listRoleUsers(req.validated.params.id, req.validated.query);
  return sendSuccess(res, result.items, { meta: result.pagination });
}

async function assignRoleToUser(req, res) {
  return sendSuccess(
    res,
    await service.assignRoleToUser(
      req.validated.params.id,
      req.validated.params.userId,
      req.auth.userId,
      req,
    ),
  );
}

async function removeRoleFromUser(req, res) {
  return sendSuccess(
    res,
    await service.removeRoleFromUser(
      req.validated.params.id,
      req.validated.params.userId,
      req.auth.userId,
      req,
    ),
  );
}

module.exports = {
  listRoles,
  listPermissions,
  getRole,
  createRole,
  updateRole,
  replaceRolePermissions,
  listRoleUsers,
  assignRoleToUser,
  removeRoleFromUser,
};
