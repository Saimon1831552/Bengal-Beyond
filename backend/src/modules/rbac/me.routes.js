const express = require("express");
const authenticate = require("../../middleware/authenticate");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const { pool } = require("../../config/db");

const router = express.Router();
router.get("/permissions", authenticate, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT DISTINCT p.permission_key
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ?`, [req.auth.userId]);
  return sendSuccess(res, { permissions: rows.map((r) => r.permission_key), roles: req.auth.roles });
}));
module.exports = router;