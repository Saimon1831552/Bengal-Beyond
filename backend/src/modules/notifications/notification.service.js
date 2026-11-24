const { pool } = require("../../config/db");
const { enqueue } = require("./notification.queue");

const SMS_ENABLED = process.env.SMS_ENABLED === "true";

async function enqueueForUser({
  userId,
  templateKey,
  payload,
  channels = SMS_ENABLED ? ["email", "sms"] : ["email"],
  email,
  phone,
  conn = null,
}) {
  const [rows] = await (conn || pool).execute(
    "SELECT email, phone FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  const user = rows[0];
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  const activeChannels = channels.filter((ch) => ch !== "sms" || SMS_ENABLED);
  const jobs = [];
  for (const channel of activeChannels) {
    const recipient = channel === "email" ? (email || user.email) : (phone || user.phone);
    if (!recipient) continue;
    jobs.push(await enqueue({ userId, channel, recipient, templateKey, payload, conn }));
  }
  return jobs;
}

module.exports = { enqueueForUser };