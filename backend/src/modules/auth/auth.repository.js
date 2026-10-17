const { pool, withTransaction } = require("../../config/db");

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, email, password_hash, full_name, phone, nationality,
            account_status, email_verified_at
       FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function findPublicUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, email, full_name, phone, nationality, account_status,
            email_verified_at, created_at
       FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function createCustomer({ email, passwordHash, fullName, phone, nationality }) {
  return withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO users (email, password_hash, full_name, phone, nationality)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, fullName, phone || null, nationality || null],
    );
    const [[role]] = await conn.execute(
      "SELECT id FROM roles WHERE role_key = 'customer' LIMIT 1",
    );
    if (!role) throw new Error("Required customer role is not configured.");
    await conn.execute(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [result.insertId, role.id],
    );
    return result.insertId;
  });
}

async function saveRefreshToken({ userId, tokenHash, expiresAt, userAgent, ipAddress }) {
  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, INET6_ATON(?))`,
    [userId, tokenHash, expiresAt, userAgent || null, ipAddress || null],
  );
}

async function rotateRefreshToken({ oldHash, newHash, expiresAt, userAgent, ipAddress }) {
  return withTransaction(async (conn) => {
    const [[stored]] = await conn.execute(
      `SELECT id, user_id, expires_at, revoked_at
         FROM refresh_tokens WHERE token_hash = ? FOR UPDATE`,
      [oldHash],
    );
    if (!stored) return { userId: null, reason: "unknown_token" };
    if (new Date(stored.expires_at) <= new Date()) return { userId: null, reason: "expired_token" };
    if (stored.revoked_at) {
      await conn.execute(
        "UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL",
        [stored.user_id],
      );
      return { userId: null, reason: "token_reuse", affectedUserId: stored.user_id };
    }
    const [updated] = await conn.execute(
      "UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE id = ? AND revoked_at IS NULL",
      [stored.id],
    );
    if (updated.affectedRows !== 1) return { userId: null, reason: "token_reuse", affectedUserId: stored.user_id };
    await conn.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES (?, ?, ?, ?, INET6_ATON(?))`,
      [stored.user_id, newHash, expiresAt, userAgent || null, ipAddress || null],
    );
    return { userId: stored.user_id, reason: null };
  });
}

async function revokeRefreshToken(tokenHash) {
  await pool.execute(
    `UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP()
     WHERE token_hash = ? AND revoked_at IS NULL`,
    [tokenHash],
  );
}

async function updatePasswordHash(userId, passwordHash) {
  await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
}

async function touchLastLogin(userId) {
  await pool.execute("UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [userId]);
}

module.exports = {
  findUserByEmail,
  findPublicUserById,
  createCustomer,
  saveRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  updatePasswordHash,
  touchLastLogin,
};
