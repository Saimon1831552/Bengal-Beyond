const service = require("./admin-audit.service");

exports.listAuditLogs = async (req, res) => {
  const result = await service.listAuditLogs(req.query);
  res.json({ success: true, data: result.items, meta: result.meta });
};

exports.listSecurityEvents = async (req, res) => {
  const result = await service.listSecurityEvents(req.query);
  res.json({ success: true, data: result.items, meta: result.meta });
};

exports.securitySummary = async (_req, res) => {
  res.json({ success: true, data: await service.securitySummary() });
};

exports.getAuditLog = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "id must be a positive integer." } });
  }
  const row = await service.getAuditLog(id);
  if (!row) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Audit log not found." } });
  res.json({ success: true, data: row });
};
