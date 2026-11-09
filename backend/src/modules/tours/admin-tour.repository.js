const { pool } = require("../../config/db");

const FIELDS = ["slug", "title", "summary", "description", "destination", "duration_days", "base_price", "currency_code", "cover_image_url", "cancellation_policy"];
const SELECT_FIELDS = `id, slug, title, summary, description, destination, duration_days,
  base_price, currency_code, status, cover_image_url, cancellation_policy,
  created_by, updated_by, created_at, updated_at`;

async function findById(id, { includeDeleted = false } = {}) {
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM tours WHERE id = ? ${includeDeleted ? "" : "AND deleted_at IS NULL"} LIMIT 1`, [id],
  );
  return rows[0] || null;
}
async function findBySlug(slug) {
  const [rows] = await pool.execute("SELECT id FROM tours WHERE slug = ? LIMIT 1", [slug]);
  return rows[0] || null;
}
async function create(data, actorId) {
  const fields = FIELDS.filter((field) => data[field] !== undefined);
  const values = fields.map((field) => data[field] === undefined ? null : data[field]);
  const columns = [...fields, "status", "created_by", "updated_by"];
  const params = [...values, "draft", actorId, actorId];
  const [result] = await pool.execute(
    `INSERT INTO tours (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`, params,
  );
  return findById(result.insertId);
}
async function update(id, data, actorId) {
  const fields = FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(data, field));
  const assignments = fields.map((field) => `${field} = ?`);
  const values = fields.map((field) => data[field]);
  assignments.push("updated_by = ?"); values.push(actorId, id);
  const [result] = await pool.execute(
    `UPDATE tours SET ${assignments.join(", ")} WHERE id = ? AND deleted_at IS NULL`, values,
  );
  if (!result.affectedRows) return null;
  return findById(id);
}
async function updateStatus(id, status, actorId) {
  const [result] = await pool.execute(
    "UPDATE tours SET status = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL", [status, actorId, id],
  );
  if (!result.affectedRows) return null;
  return findById(id);
}
async function softDelete(id, actorId) {
  const [result] = await pool.execute(
    "UPDATE tours SET deleted_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ? AND deleted_at IS NULL", [actorId, id],
  );
  return result.affectedRows > 0;
}
module.exports = { findById, findBySlug, create, update, updateStatus, softDelete };
