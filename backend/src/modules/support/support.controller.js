const service = require("./support.service");
const v = require("./support.validation");

function send(res, data, message, status = 200) {
  return res.status(status).json({ success: true, message, data });
}
function pagination(query) {
  const page = Math.max(1, Math.min(1000000, Number.parseInt(query.page, 10) || 1));
  const limit = Math.max(1, Math.min(100, Number.parseInt(query.limit, 10) || 20));
  return { page, limit };
}
exports.createPublic = async (req, res, next) => {
  try {
    const data = await service.createTicket({
      guestName: v.requiredText(req.body.name, 160, "Name"),
      guestEmail: v.email(req.body.email),
      guestPhone: v.optionalText(req.body.phone, 40, "Phone"),
      category: v.enumValue(req.body.category, v.CATEGORIES, "category") || "general",
      subject: v.requiredText(req.body.subject, 200, "Subject"),
      message: v.requiredText(req.body.message, 10000, "Message")
    });
    return send(res, data, "Enquiry submitted", 201);
  } catch (e) { next(e); }
};
exports.createCustomer = async (req, res, next) => {
  try {
    const data = await service.createTicket({
      userId: req.user.id,
      category: v.enumValue(req.body.category, v.CATEGORIES, "category") || "general",
      subject: v.requiredText(req.body.subject, 200, "Subject"),
      message: v.requiredText(req.body.message, 10000, "Message")
    });
    return send(res, data, "Support ticket created", 201);
  } catch (e) { next(e); }
};
exports.listCustomer = async (req, res, next) => {
  try { return send(res, await service.listCustomerTickets(req.user.id, pagination(req.query)), "Tickets retrieved"); }
  catch (e) { next(e); }
};
exports.getCustomer = async (req, res, next) => {
  try { return send(res, await service.getCustomerTicket(req.user.id, v.positiveId(req.params.ticketId, "ticketId")), "Ticket retrieved"); }
  catch (e) { next(e); }
};
exports.replyCustomer = async (req, res, next) => {
  try {
    const data = await service.addCustomerReply(req.user.id, v.positiveId(req.params.ticketId, "ticketId"),
      v.requiredText(req.body.message, 10000, "Message"));
    return send(res, data, "Reply added");
  } catch (e) { next(e); }
};
exports.listAdmin = async (req, res, next) => {
  try {
    const page = pagination(req.query);
    const filters = {
      ...page,
      q: typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "",
      status: v.enumValue(req.query.status, v.STATUSES, "status"),
      priority: v.enumValue(req.query.priority, v.PRIORITIES, "priority"),
      category: v.enumValue(req.query.category, v.CATEGORIES, "category")
    };
    return send(res, await service.listAdminTickets(filters), "Support tickets retrieved");
  } catch (e) { next(e); }
};
exports.getAdmin = async (req, res, next) => {
  try { return send(res, await service.getAdminTicket(v.positiveId(req.params.ticketId, "ticketId")), "Ticket retrieved"); }
  catch (e) { next(e); }
};
exports.replyAdmin = async (req, res, next) => {
  try {
    const data = await service.addStaffMessage(
      v.positiveId(req.params.ticketId, "ticketId"), req.user.id,
      v.requiredText(req.body.message, 10000, "Message"), req.body.internal === true);
    return send(res, data, data.internal ? "Internal note added" : "Reply sent");
  } catch (e) { next(e); }
};
exports.updateAdmin = async (req, res, next) => {
  try {
    const patch = {
      status: v.enumValue(req.body.status, v.STATUSES, "status"),
      priority: v.enumValue(req.body.priority, v.PRIORITIES, "priority")
    };
    if (Object.prototype.hasOwnProperty.call(req.body, "assignedTo")) {
      patch.assignedTo = req.body.assignedTo === null ? null : v.positiveId(req.body.assignedTo, "assignedTo");
    }
    return send(res, await service.updateTicket(v.positiveId(req.params.ticketId, "ticketId"), patch), "Ticket updated");
  } catch (e) { next(e); }
};
