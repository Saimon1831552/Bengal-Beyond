const { pool, withTransaction } = require("../../config/db");
const { renderTemplate } = require("./notification.templates");
const emailProvider = require("./providers/email.provider");
const smsProvider = require("./providers/sms.provider");


async function claimOne() {
  return withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM notification_jobs
        WHERE status = 'queued' AND available_at <= NOW() AND attempts < max_attempts
        ORDER BY available_at ASC, id ASC LIMIT 1 FOR UPDATE`);
    if (!rows.length) return null;
    const job = rows[0];
    await conn.execute(
      `UPDATE notification_jobs SET status = 'processing', locked_at = NOW(), attempts = attempts + 1
        WHERE id = ?`, [job.id]);
    return { ...job, attempts: Number(job.attempts) + 1 };
  });
}
async function processOne() {
  const job = await claimOne();
  if (!job) return false;
  try {
    const [[template]] = await pool.execute(
      `SELECT * FROM notification_templates
        WHERE template_key = ? AND channel = ? AND is_active = 1`,
      [job.template_key, job.channel]);
    if (!template) throw new Error(`Active template not found: ${job.template_key}/${job.channel}`);
    let payload;
    try { payload = JSON.parse(job.payload_json); }
    catch (_) { throw new Error("Notification payload is not valid JSON"); }
    const rendered = renderTemplate(template, payload);
    const result = job.channel === "email"
      ? await emailProvider.send({ to: job.recipient, subject: rendered.subject || "", text: rendered.body })
      : await smsProvider.send({ to: job.recipient, text: rendered.body });

    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE notification_jobs SET status = 'sent', sent_at = NOW(), locked_at = NULL, last_error = NULL
          WHERE id = ?`, [job.id]);
      await conn.execute(
        `INSERT INTO notification_attempts (job_id, attempt_number, outcome, provider_message_id)
         VALUES (?, ?, 'sent', ?)`,
        [job.id, job.attempts, result && result.messageId ? String(result.messageId).slice(0, 190) : null]);
    });
  } catch (error) {
    const message = String(error && error.message || "Delivery failed").slice(0, 1000);
    const retry = job.attempts < Number(job.max_attempts);
    const delaySeconds = Math.min(3600, 30 * (2 ** Math.max(0, job.attempts - 1)));
    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE notification_jobs SET status = ?, locked_at = NULL, last_error = ?,
          available_at = CASE WHEN ? = 1 THEN DATE_ADD(NOW(), INTERVAL ? SECOND) ELSE available_at END
          WHERE id = ?`,
        [retry ? "queued" : "failed", message, retry ? 1 : 0, delaySeconds, job.id]);
      await conn.execute(
        `INSERT INTO notification_attempts (job_id, attempt_number, outcome, error_message)
         VALUES (?, ?, 'failed', ?)`, [job.id, job.attempts, message]);
    });
  }
  return true;
}
async function runWorker({ pollMs = 3000, batchSize = 10 } = {}) {
  let stopped = false;
  const stop = () => { stopped = true; };
  async function loop() {
    while (!stopped) {
      let worked = false;
      for (let i = 0; i < batchSize && !stopped; i++) {
        const didWork = await processOne();
        if (!didWork) break;
        worked = true;
      }
      if (!worked) await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }
  const promise = loop();
  return { stop, promise };
}
module.exports = { processOne, runWorker };
