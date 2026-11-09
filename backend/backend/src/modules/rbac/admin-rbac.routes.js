const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asynchandler");
const controller = require("./admin-rbac.controller");
const {
  roleParams,
  roleUserParams,
  roleBody,
  roleUpdateBody,
  rolePermissionsBody,
  roleListQuery,
} = require("./admin-rbac.schema");

const router = express.Router();
router.use(authenticate, authorize("roles.manage"));

router.get("/", validate({ query: roleListQuery }), asyncHandler(controller.listRoles));
router.get("/permissions", asyncHandler(controller.listPermissions));
router.post("/", validate({ body: roleBody }), asyncHandler(controller.createRole));
router.patch(
  "/:id",
  validate({ params: roleParams, body: roleUpdateBody }),
  asyncHandler(controller.updateRole),
);
router.get("/:id", validate({ params: roleParams }), asyncHandler(controller.getRole));
router.put(
  "/:id/permissions",
  validate({ params: roleParams, body: rolePermissionsBody }),
  asyncHandler(controller.replaceRolePermissions),
);
router.get("/:id/users", validate({ params: roleParams, query: roleListQuery }), asyncHandler(controller.listRoleUsers));
router.put("/:id/users/:userId", validate({ params: roleUserParams }), asyncHandler(controller.assignRoleToUser));
router.delete("/:id/users/:userId", validate({ params: roleUserParams }), asyncHandler(controller.removeRoleFromUser));

module.exports = router;
