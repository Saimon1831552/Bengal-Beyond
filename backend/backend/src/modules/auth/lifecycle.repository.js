const { pool, withTransaction } = require("../../config/db");

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT id, email, account_status, email_verified_at FROM users WHERE email = ? LIMIT 1", [email],
  );
  return rows[0] || null;
}

async function createActionToken({ userId, type, tokenHash, expiresAt }) {
  await pool.execute(
    "INSERT INTO user_action_tokens (user_id, token_type, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [userId, type, tokenHash, expiresAt],
  );
}

async function consumeActionToken({ tokenHash, type }) {
  return withTransaction(async (conn) => {
    const [[row]] = await conn.execute(
      `SELECT id, user_id FROM user_action_tokens
       WHERE token_hash = ? AND token_type = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
       FOR UPDATE`, [tokenHash, type],
    );
    if (!row) return null;
    const [updated] = await conn.execute(
      "UPDATE user_action_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ? AND used_at IS NULL", [row.id],
    );
    return updated.affectedRows === 1 ? row.user_id : null;
  });
}

async function markEmailVerified(userId) {
  await pool.execute(
    "UPDATE users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()) WHERE id = ? AND account_status = 'active'",
    [userId],
  );
}

async function updatePasswordAndRevokeSessions(userId, passwordHash) {
  await withTransaction(async (conn) => {
    await conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
    await conn.execute("UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL", [userId]);
    await conn.execute("UPDATE user_action_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND used_at IS NULL", [userId]);
  });
}

module.exports = { findUserByEmail, createActionToken, consumeActionToken, markEmailVerified, updatePasswordAndRevokeSessions };
