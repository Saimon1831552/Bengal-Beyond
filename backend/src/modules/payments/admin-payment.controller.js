const service = require("./admin-payment.service");

exports.list = async (req, res) => {
  const result = await service.list(req.query);
  res.json({ success: true, ...result });
};

exports.getById = async (req, res) => {
  const payment = await service.getById(req.params.id);
  res.json({ success: true, data: payment });
};

exports.verify = async (req, res) => {
  const actorId = req.user?.id ?? req.user?.user_id ?? null;
  const payment = await service.verify(req.params.id, actorId, req.body?.note);
  res.json({ success: true, message: "Payment marked as verified.", data: payment });
};

exports.markFailed = async (req, res) => {
  const actorId = req.user?.id ?? req.user?.user_id ?? null;
  const payment = await service.markFailed(req.params.id, actorId, req.body?.note);
  res.json({ success: true, message: "Payment marked as failed.", data: payment });
};
