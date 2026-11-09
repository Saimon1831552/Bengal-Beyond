const crypto = require("crypto");
const { pool, withTransaction } = require("../../config/db");
const v = require("./support.validation");

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}
function reference() {
  return `BB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
async function createTicket(input) {
  return withTransaction(async (conn) => {
    const ref = reference();
    const [result] = await conn.execute(
      `INSERT INTO support_tickets
        (ticket_reference, user_id, guest_name, guest_email, guest_phone, category, subject)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ref, input.userId || null, input.guestName || null, input.guestEmail || null,
       input.guestPhone || null, input.category || "general", input.subject]);
    await conn.execute(
      `INSERT INTO support_messages (ticket_id, sender_type, sender_user_id, message_text)
       VALUES (?, 'customer', ?, ?)`,
      [result.insertId, input.userId || null, input.message]);
    return { id: Number(result.insertId), ticketReference: ref, status: "open" };
  });
}
async function listCustomerTickets(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT id, ticket_reference, category, subject, status, priority,
            last_message_at, created_at, updated_at
       FROM support_tickets WHERE user_id = ?
      ORDER BY last_message_at DESC LIMIT ? OFFSET ?`, [userId, limit, offset]);
  const [[count]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM support_tickets WHERE user_id = ?", [userId]);
  return { items: rows, pagination: { page, limit, total: Number(count.total) } };
}
async function getCustomerTicket(userId, ticketId) {
  const [[ticket]] = await pool.execute(
    `SELECT id, ticket_reference, category, subject, status, priority, created_at, updated_at
       FROM support_tickets WHERE id = ? AND user_id = ?`, [ticketId, userId]);
  if (!ticket) httpError("Support ticket not found", 404);
  const [messages] = await pool.execute(
    `SELECT id, sender_type, message_text, created_at
       FROM support_messages
      WHERE ticket_id = ? AND is_internal = 0 ORDER BY created_at ASC, id ASC`, [ticketId]);
  return { ...ticket, messages };
}
async function addCustomerReply(userId, ticketId, message) {
  return withTransaction(async (conn) => {
    const [[ticket]] = await conn.execute(
      "SELECT id, status FROM support_tickets WHERE id = ? AND user_id = ? FOR UPDATE",
      [ticketId, userId]);
    if (!ticket) httpError("Support ticket not found", 404);
    if (ticket.status === "closed") httpError("This ticket is closed", 409);
    await conn.execute(
      `INSERT INTO support_messages (ticket_id, sender_type, sender_user_id, message_text)
       VALUES (?, 'customer', ?, ?)`, [ticketId, userId, message]);
    await conn.execute(
      `UPDATE support_tickets SET status = 'open', last_message_at = NOW(),
        resolved_at = NULL, closed_at = NULL WHERE id = ?`, [ticketId]);
    return { ticketId, status: "open" };
  });
}
async function listAdminTickets(filters) {
  const where = [];
  const params = [];
  if (filters.status) { where.push("t.status = ?"); params.push(filters.status); }
  if (filters.priority) { where.push("t.priority = ?"); params.push(filters.priority); }
  if (filters.category) { where.push("t.category = ?"); params.push(filters.category); }
  if (filters.q) {
    where.push("(t.ticket_reference LIKE ? OR t.subject LIKE ? OR t.guest_email LIKE ? OR u.email LIKE ?)");
    const q = `%${filters.q}%`;
    params.push(q, q, q, q);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (filters.page - 1) * filters.limit;
  const [items] = await pool.execute(
    `SELECT t.id, t.ticket_reference, t.user_id, t.guest_name, t.guest_email,
            t.category, t.subject, t.status, t.priority, t.assigned_to,
            t.last_message_at, t.created_at, u.email AS account_email
       FROM support_tickets t LEFT JOIN users u ON u.id = t.user_id
       ${clause} ORDER BY FIELD(t.priority,'urgent','high','normal','low'),
         t.last_message_at DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]);
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM support_tickets t
       LEFT JOIN users u ON u.id = t.user_id ${clause}`, params);
  return { items, pagination: { page: filters.page, limit: filters.limit, total: Number(count.total) } };
}
async function getAdminTicket(ticketId) {
  const [[ticket]] = await pool.execute(
    `SELECT t.*, u.email AS account_email, u.full_name AS account_name
       FROM support_tickets t LEFT JOIN users u ON u.id = t.user_id WHERE t.id = ?`,
    [ticketId]);
  if (!ticket) httpError("Support ticket not found", 404);
  const [messages] = await pool.execute(
    `SELECT id, sender_type, sender_user_id, message_text, is_internal, created_at
       FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC, id ASC`, [ticketId]);
  return { ...ticket, messages };
}
async function addStaffMessage(ticketId, staffId, message, isInternal) {
  return withTransaction(async (conn) => {
    const [[ticket]] = await conn.execute("SELECT id, status FROM support_tickets WHERE id = ? FOR UPDATE", [ticketId]);
    if (!ticket) httpError("Support ticket not found", 404);
    await conn.execute(
      `INSERT INTO support_messages (ticket_id, sender_type, sender_user_id, message_text, is_internal)
       VALUES (?, 'staff', ?, ?, ?)`, [ticketId, staffId, message, isInternal ? 1 : 0]);
    await conn.execute(
      `UPDATE support_tickets SET last_message_at = NOW(),
        status = CASE WHEN ? = 1 THEN status ELSE 'waiting_customer' END,
        resolved_at = CASE WHEN ? = 1 THEN resolved_at ELSE NULL END,
        closed_at = CASE WHEN ? = 1 THEN closed_at ELSE NULL END
       WHERE id = ?`, [isInternal ? 1 : 0, isInternal ? 1 : 0, isInternal ? 1 : 0, ticketId]);
    return { ticketId, messageAdded: true, internal: Boolean(isInternal) };
  });
}
async function updateTicket(ticketId, patch) {
  return withTransaction(async (conn) => {
    const [[ticket]] = await conn.execute("SELECT id FROM support_tickets WHERE id = ? FOR UPDATE", [ticketId]);
    if (!ticket) httpError("Support ticket not found", 404);
    const sets = [];
    const params = [];
    if (patch.status) {
      sets.push("status = ?"); params.push(patch.status);
      sets.push("resolved_at = CASE WHEN ? = 'resolved' THEN NOW() ELSE NULL END"); params.push(patch.status);
      sets.push("closed_at = CASE WHEN ? = 'closed' THEN NOW() ELSE NULL END"); params.push(patch.status);
    }
    if (patch.priority) { sets.push("priority = ?"); params.push(patch.priority); }
    if (patch.assignedTo !== undefined) { sets.push("assigned_to = ?"); params.push(patch.assignedTo); }
    if (!sets.length) httpError("No valid ticket fields supplied", 400);
    params.push(ticketId);
    await conn.execute(`UPDATE support_tickets SET ${sets.join(", ")} WHERE id = ?`, params);
    return { ticketId, updated: true };
  });
}
module.exports = {
  createTicket, listCustomerTickets, getCustomerTicket, addCustomerReply,
  listAdminTickets, getAdminTicket, addStaffMessage, updateTicket
};
