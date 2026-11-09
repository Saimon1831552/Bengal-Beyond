const { pool, withTransaction } = require("../../config/db");

const tables = {
  categories: { table: "tour_categories", join: "tour_category_assignments", fk: "category_id" },
  tags: { table: "tour_tags", join: "tour_tag_assignments", fk: "tag_id" },
};
function config(kind) {
  const c = tables[kind];
  if (!c) { const e = new Error("Unknown taxonomy type"); e.statusCode = 400; throw e; }
  return c;
}
async function list(kind, { includeInactive = false, q = "" } = {}) {
  const c = config(kind);
  const where = [];
  const params = [];
  if (!includeInactive) where.push("status = 'active'");
  if (q) { where.push("(name LIKE ? OR slug LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  const sql = `SELECT id, name, slug, description, status, created_at, updated_at
    FROM ${c.table} ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY name ASC`;
  const [rows] = await pool.execute(sql, params);
  return rows;
}
async function get(kind, id) {
  const c = config(kind);
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description, status, created_at, updated_at FROM ${c.table} WHERE id = ?`,
    [id]
  );
  if (!rows.length) { const e = new Error("Taxonomy item not found"); e.statusCode = 404; throw e; }
  return rows[0];
}
async function create(kind, data) {
  const c = config(kind);
  const [result] = await pool.execute(
    `INSERT INTO ${c.table} (name, slug, description, status) VALUES (?, ?, ?, ?)`,
    [data.name.trim(), data.slug, data.description || null, data.status || "active"]
  );
  return get(kind, result.insertId);
}
async function update(kind, id, data) {
  const c = config(kind);
  await get(kind, id);
  const fields = [], values = [];
  for (const key of ["name", "slug", "description", "status"]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === "name" ? data[key].trim() : data[key]);
    }
  }
  if (fields.length) {
    fields.push("updated_at = CURRENT_TIMESTAMP");
    await pool.execute(`UPDATE ${c.table} SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
  }
  return get(kind, id);
}
async function remove(kind, id) {
  const c = config(kind);
  await get(kind, id);
  const [[usage]] = await pool.execute(`SELECT COUNT(*) AS total FROM ${c.join} WHERE ${c.fk} = ?`, [id]);
  if (usage.total) {
    const e = new Error("Cannot delete an item assigned to tours; set it inactive instead");
    e.statusCode = 409; throw e;
  }
  await pool.execute(`DELETE FROM ${c.table} WHERE id = ?`, [id]);
}
async function assign(tourId, categoryIds = [], tagIds = []) {
  return withTransaction(async (conn) => {
    const [[tour]] = await conn.execute("SELECT id FROM tours WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [tourId]);
    if (!tour) { const e = new Error("Tour not found"); e.statusCode = 404; throw e; }
    for (const [ids, table, fk] of [
      [categoryIds, "tour_categories", "category_id"], [tagIds, "tour_tags", "tag_id"]
    ]) {
      const unique = [...new Set(ids.map(Number))];
      if (unique.some((n) => !Number.isSafeInteger(n) || n < 1)) {
        const e = new Error("All taxonomy IDs must be positive integers"); e.statusCode = 400; throw e;
      }
      if (unique.length) {
        const [found] = await conn.query(
          `SELECT id FROM ${table} WHERE status = 'active' AND id IN (${unique.map(() => "?").join(",")})`,
          unique
        );
        if (found.length !== unique.length) {
          const e = new Error(`One or more ${table === "tour_tags" ? "tag" : "category"} IDs are invalid or inactive`);
          e.statusCode = 400; throw e;
        }
      }
      const join = table === "tour_tags" ? "tour_tag_assignments" : "tour_category_assignments";
      await conn.execute(`DELETE FROM ${join} WHERE tour_id = ?`, [tourId]);
      for (const id of unique) await conn.execute(
        `INSERT INTO ${join} (tour_id, ${fk}) VALUES (?, ?)`, [tourId, id]
      );
    }
    return { tourId, categoryIds: [...new Set(categoryIds.map(Number))], tagIds: [...new Set(tagIds.map(Number))] };
  });
}
async function tourTaxonomy(tourId) {
  const [[tour]] = await pool.execute("SELECT id FROM tours WHERE id = ? AND deleted_at IS NULL", [tourId]);
  if (!tour) { const e = new Error("Tour not found"); e.statusCode = 404; throw e; }
  const [categories] = await pool.execute(
    `SELECT c.id, c.name, c.slug FROM tour_categories c
     JOIN tour_category_assignments a ON a.category_id = c.id WHERE a.tour_id = ? ORDER BY c.name`, [tourId]);
  const [tags] = await pool.execute(
    `SELECT t.id, t.name, t.slug FROM tour_tags t
     JOIN tour_tag_assignments a ON a.tag_id = t.id WHERE a.tour_id = ? ORDER BY t.name`, [tourId]);
  return { categories, tags };
}
module.exports = { list, get, create, update, remove, assign, tourTaxonomy };
