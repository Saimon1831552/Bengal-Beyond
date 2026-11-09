const { pool, withTransaction } = require("../../config/db");
const AppError = require("../../utils/appError");

async function listRoles({ search, page, limit }) {
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push("(r.role_key LIKE ? OR r.name LIKE ? OR r.description LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM roles r ${where}`,
    params,
  );
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(`
    SELECT r.id, r.role_key, r.name, r.description, r.created_at,
           COUNT(DISTINCT rp.permission_id) AS permission_count,
           GROUP_CONCAT(DISTINCT p.permission_key ORDER BY p.permission_key SEPARATOR ',') AS permission_keys
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      ${where}
     GROUP BY r.id
     ORDER BY r.id
     LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return {
    items: rows.map((row) => ({
      ...row,
      permission_count: Number(row.permission_count),
      permissions: row.permission_keys ? row.permission_keys.split(",") : [],
      isSystem: ["super_admin", "customer"].includes(row.role_key),
    })),
    total: Number(countRow.total),
  };
}

async function listPermissions() {
  const [rows] = await pool.query(
    "SELECT permission_key, description FROM permissions ORDER BY permission_key",
  );
  return rows;
}

async function findRole(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT r.id, r.role_key, r.name, r.description,
            GROUP_CONCAT(DISTINCT p.permission_key ORDER BY p.permission_key SEPARATOR ',') AS permission_keys
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.id = ?
      GROUP BY r.id
      LIMIT 1`,
    [id],
  );
  if (!rows[0]) return null;
  return { ...rows[0], permissions: rows[0].permission_keys ? rows[0].permission_keys.split(",") : [] };
}

async function listUsersForRole(roleId, { page, limit, search }) {
  const conditions = ["ur.role_id = ?", "u.account_status <> 'deleted'"];
  const params = [roleId];
  if (search) {
    conditions.push("(u.full_name LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR) = ?)");
    const term = `%${search}%`;
    params.push(term, term, search);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM user_roles ur JOIN users u ON u.id = ur.user_id ${where}`,
    params,
  );
  const offset = (page - 1) * limit;
  const [items] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.account_status, ur.assigned_by, ur.assigned_at
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       ${where}
      ORDER BY u.full_name, u.id
      LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return { items, total: Number(countRow.total) };
}

async function getActorAccess(userId) {
  const [[actor]] = await pool.execute(
    `SELECT EXISTS (
       SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ? AND r.role_key = 'super_admin'
     ) AS is_super_admin`,
    [userId],
  );
  const [permissions] = await pool.execute(
    `SELECT DISTINCT p.permission_key
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ?`,
    [userId],
  );
  return {
    isSuperAdmin: Boolean(actor.is_super_admin),
    permissions: new Set(permissions.map((row) => row.permission_key)),
  };
}

async function createRole({ key, name, description, permissionIds, permissionKeys, actorId, request }) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute(
      "INSERT INTO roles (role_key, name, description) VALUES (?, ?, ?)",
      [key, name, description || null],
    );
    for (const permissionId of permissionIds) {
      await connection.execute(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        [result.insertId, permissionId],
      );
    }
    await writeAudit(connection, {
      actorId,
      action: "rbac.role.create",
      entityId: result.insertId,
      request,
      after: { key, name, description: description || null, permissions: permissionKeys },
    });
    return findRole(result.insertId, connection);
  });
}

async function updateRole({ id, name, description, actorId, request }) {
  return withTransaction(async (connection) => {
    await connection.execute("SELECT id FROM roles WHERE id = ? FOR UPDATE", [id]);
    const role = await findRole(id, connection);
    if (!role) return null;
    const before = { name: role.name, description: role.description, permissions: role.permissions };
    const nextName = name === undefined ? role.name : name;
    const nextDescription = description === undefined ? role.description : description;
    await connection.execute(
      "UPDATE roles SET name = ?, description = ? WHERE id = ?",
      [nextName, nextDescription, id],
    );
    const updated = await findRole(id, connection);
    await writeAudit(connection, {
      actorId,
      action: "rbac.role.update",
      entityId: id,
      request,
      before,
      after: {
        name: updated.name,
        description: updated.description,
        permissions: updated.permissions,
      },
    });
    return updated;
  });
}

async function replaceRolePermissions({ id, permissionIds, permissionKeys, actorId, request }) {
  return withTransaction(async (connection) => {
    const [[lockedRole]] = await connection.execute(
      "SELECT id, role_key FROM roles WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!lockedRole) return null;
    const role = await findRole(id, connection);
    await connection.execute("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    for (const permissionId of permissionIds) {
      await connection.execute(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        [id, permissionId],
      );
    }
    await writeAudit(connection, {
      actorId,
      action: "rbac.role.permissions.replace",
      entityId: id,
      request,
      before: { permissions: role.permissions },
      after: { permissions: permissionKeys },
    });
    return findRole(id, connection);
  });
}

async function assignRoleToUser({ roleId, userId, actorId, request }) {
  return withTransaction(async (connection) => {
    const [[user]] = await connection.execute(
      "SELECT id FROM users WHERE id = ? AND account_status <> 'deleted' FOR UPDATE",
      [userId],
    );
    if (!user) return null;
    const [[role]] = await connection.execute(
      "SELECT id, role_key FROM roles WHERE id = ? FOR UPDATE",
      [roleId],
    );
    if (!role) return false;
    const [[existing]] = await connection.execute(
      "SELECT user_id FROM user_roles WHERE user_id = ? AND role_id = ? FOR UPDATE",
      [userId, roleId],
    );
    if (existing) return { userId, roleId, alreadyAssigned: true };
    await connection.execute(
      "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)",
      [userId, roleId, actorId],
    );
    await writeAudit(connection, {
      actorId,
      action: "rbac.role.user.assign",
      entityId: userId,
      request,
      before: null,
      after: { roleId, roleKey: role.role_key, userId },
    });
    return { userId, roleId, alreadyAssigned: false };
  });
}

async function removeRoleFromUser({ roleId, userId, actorId, request }) {
  return withTransaction(async (connection) => {
    const [[role]] = await connection.execute(
      "SELECT id, role_key FROM roles WHERE id = ? FOR UPDATE",
      [roleId],
    );
    if (!role) return false;
    const [deleted] = await connection.execute(
      "DELETE FROM user_roles WHERE user_id = ? AND role_id = ?",
      [userId, roleId],
    );
    if (deleted.affectedRows === 0) return null;
    await writeAudit(connection, {
      actorId,
      action: "rbac.role.user.remove",
      entityId: userId,
      request,
      before: { roleId, roleKey: role.role_key, userId },
      after: null,
    });
    return { userId, roleId, removed: true };
  });
}

async function writeAudit(connection, { actorId, action, entityId, request, before = null, after }) {
  await connection.execute(
    `INSERT INTO audit_logs
       (actor_user_id, action, entity_type, entity_id, request_id, ip_address, user_agent, before_data, after_data)
     VALUES (?, ?, 'rbac', ?, ?, INET6_ATON(?), ?, ?, ?)`,
    [
      actorId,
      action,
      entityId,
      typeof request?.id === "string" ? request.id.slice(0, 100) : null,
      typeof request?.ip === "string" ? request.ip.slice(0, 45) : null,
      typeof request?.get === "function" ? (request.get("user-agent") || "").slice(0, 500) || null : null,
      before === null ? null : JSON.stringify(before),
      JSON.stringify(after),
    ],
  );
}

async function resolvePermissionIds(keys) {
  if (!keys.length) return [];
  const placeholders = keys.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT id, permission_key FROM permissions WHERE permission_key IN (${placeholders})`,
    keys,
  );
  return rows;
}

module.exports = {
  listRoles,
  listPermissions,
  findRole,
  listUsersForRole,
  getActorAccess,
  createRole,
  updateRole,
  replaceRolePermissions,
  assignRoleToUser,
  removeRoleFromUser,
  resolvePermissionIds,
};
