INSERT INTO permissions (permission_key, description)
VALUES ('roles.manage', 'Manage staff roles and permission grants')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
  FROM roles
  JOIN permissions ON permissions.permission_key = 'roles.manage'
 WHERE roles.role_key = 'super_admin'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);
