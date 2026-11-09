const { pool } = require("../../config/db");
const { validateChannel, validateKey } = require("./notification.validation");

exports.listJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const status = req.query.status;
    const where = [];
    const params = [];
    if (status) {
      if (!["queued","processing","sent","failed","cancelled"].includes(status)) {
        const e = new Error("Invalid status"); e.statusCode = 400; throw e;
      }
      where.push("status = ?"); params.push(status);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [items] = await pool.execute(
      `SELECT id, user_id, channel, recipient, template_key, status, attempts,
              max_attempts, available_at, sent_at, last_error, created_at
         FROM notification_jobs ${clause}
        ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
    return res.json({ success: true, data: { items, page, limit } });
  } catch (e) { next(e); }
};
exports.upsertTemplate = async (req, res, next) => {
  try {
    const key = validateKey(req.body.templateKey);
    const channel = validateChannel(req.body.channel);
    if (typeof req.body.bodyTemplate !== "string" || !req.body.bodyTemplate.trim()) {
      const e = new Error("bodyTemplate is required"); e.statusCode = 400; throw e;
    }
    const subject = req.body.subjectTemplate == null ? null : String(req.body.subjectTemplate).slice(0,255);
    await pool.execute(
      `INSERT INTO notification_templates (template_key, channel, subject_template, body_template, is_active)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE subject_template = VALUES(subject_template),
         body_template = VALUES(body_template), is_active = VALUES(is_active)`,
      [key, channel, subject, req.body.bodyTemplate, req.body.isActive === false ? 0 : 1]);
    return res.status(200).json({ success: true, message: "Template saved" });
  } catch (e) { next(e); }
};
exports.retryJob = async (req, res, next) => {
  try {
    const id = Number(req.params.jobId);
    if (!Number.isSafeInteger(id) || id < 1) { const e = new Error("Invalid jobId"); e.statusCode = 400; throw e; }
    const [result] = await pool.execute(
      `UPDATE notification_jobs SET status = 'queued', attempts = 0, available_at = NOW(),
        locked_at = NULL, last_error = NULL WHERE id = ? AND status = 'failed'`, [id]);
    if (!result.affectedRows) { const e = new Error("Failed notification job not found"); e.statusCode = 404; throw e; }
    return res.json({ success: true, message: "Notification job queued for retry" });
  } catch (e) { next(e); }
};
