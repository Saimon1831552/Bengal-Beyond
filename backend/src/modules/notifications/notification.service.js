const { pool } = require("../../config/db");
const { enqueue } = require("./notification.queue");

async function enqueueForUser({ userId, templateKey, payload, channels = ["email", "sms"], email, phone, conn = null }) {
  const [rows] = await (conn || pool).execute(
    "SELECT email, phone FROM users WHERE id = ? LIMIT 1", [userId]);
  const user = rows[0];
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  const jobs = [];
  for (const channel of channels) {
    const recipient = channel === "email" ? (email || user.email) : (phone || user.phone);
    if (!recipient) continue;
    jobs.push(await enqueue({ userId, channel, recipient, templateKey, payload, conn }));
  }
  return jobs;
}
module.exports = { enqueueForUser };
