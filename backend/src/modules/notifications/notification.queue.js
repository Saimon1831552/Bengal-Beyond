const { pool, withTransaction } = require("../../config/db");
const { validateChannel, validateRecipient, validateKey } = require("./notification.validation");

async function enqueue({ userId = null, channel, recipient, templateKey, payload = {}, idempotencyKey = null, conn = null }) {
  validateChannel(channel);
  validateRecipient(channel, recipient);
  validateKey(templateKey);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw Object.assign(new Error("payload must be an object"), { statusCode: 400 });
  }
  if (idempotencyKey !== null && (typeof idempotencyKey !== "string" || idempotencyKey.length > 190)) {
    throw Object.assign(new Error("Invalid idempotency key"), { statusCode: 400 });
  }
  const db = conn || pool;
  const [result] = await db.execute(
    `INSERT INTO notification_jobs
      (user_id, channel, recipient, template_key, payload_json, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [userId, channel, recipient, templateKey, JSON.stringify(payload), idempotencyKey]);
  return { jobId: Number(result.insertId), queued: true };
}
async function enqueueInTransaction(args, conn) {
  return enqueue({ ...args, conn });
}
module.exports = { enqueue, enqueueInTransaction };
