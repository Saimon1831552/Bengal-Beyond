const { pool } = require("../../config/db");

const SORTS = {
  newest: "t.created_at DESC, t.id DESC",
  price_asc: "t.base_price ASC, t.id ASC",
  price_desc: "t.base_price DESC, t.id DESC",
  duration_asc: "t.duration_days ASC, t.id ASC",
  duration_desc: "t.duration_days DESC, t.id DESC",
  title: "t.title ASC, t.id ASC",
};

function buildWhere(filters) {
  const clauses = ["t.status = 'published'", "t.deleted_at IS NULL"];
  const values = [];
  if (filters.q) {
    clauses.push("(t.title LIKE ? OR t.summary LIKE ? OR t.destination LIKE ?)");
    const term = `%${filters.q}%`;
    values.push(term, term, term);
  }
  if (filters.destination) { clauses.push("t.destination LIKE ?"); values.push(`%${filters.destination}%`); }
  if (filters.minDays !== undefined) { clauses.push("t.duration_days >= ?"); values.push(filters.minDays); }
  if (filters.maxDays !== undefined) { clauses.push("t.duration_days <= ?"); values.push(filters.maxDays); }
  if (filters.minPrice !== undefined) { clauses.push("t.base_price >= ?"); values.push(filters.minPrice); }
  if (filters.maxPrice !== undefined) { clauses.push("t.base_price <= ?"); values.push(filters.maxPrice); }
  return { sql: clauses.join(" AND "), values };
}

async function list(filters, { limit, offset }) {
  const where = buildWhere(filters);
  const orderBy = SORTS[filters.sort] || SORTS.newest;
  const [rows] = await pool.execute(
    `SELECT t.id, t.slug, t.title, t.summary, t.destination, t.duration_days,
            t.base_price, t.currency_code, t.cover_image_url, t.created_at, t.updated_at
       FROM tours t WHERE ${where.sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...where.values, limit, offset],
  );
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM tours t WHERE ${where.sql}`, where.values);
  return { rows, total: Number(count.total) };
}

async function findPublishedBySlug(slug) {
  const [rows] = await pool.execute(
    `SELECT t.id, t.slug, t.title, t.summary, t.description, t.destination,
            t.duration_days, t.base_price, t.currency_code, t.cover_image_url,
            t.cancellation_policy, t.created_at, t.updated_at
       FROM tours t WHERE t.slug = ? AND t.status = 'published' AND t.deleted_at IS NULL LIMIT 1`,
    [slug],
  );
  return rows[0] || null;
}

module.exports = { list, findPublishedBySlug };
