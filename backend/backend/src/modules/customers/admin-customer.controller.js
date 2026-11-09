const service = require("./admin-customer.service");

exports.list = async (req, res) => {
  const result = await service.list(req.query);
  res.json({ success: true, ...result });
};

exports.getById = async (req, res) => {
  const customer = await service.getById(req.params.id);
  res.json({ success: true, data: customer });
};

exports.updateStatus = async (req, res) => {
  const actorId = req.user?.id ?? req.user?.user_id ?? null;
  const result = await service.updateStatus(req.params.id, req.body?.status, actorId, req.body?.reason);
  res.json({ success: true, message: "Customer status updated.", data: result });
};
