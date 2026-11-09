const { pool } = require("../../config/db");

function buildWhere(f) {
  const clauses = ["t.status = 'published'", "t.deleted_at IS NULL"];
  const params = [];
  if (f.q) {
    const term = `%${f.q.replace(/[\\%_]/g, "\\$&")}%`;
    clauses.push("(t.title LIKE ? ESCAPE '\\\\' OR t.summary LIKE ? ESCAPE '\\\\' OR t.destination LIKE ? ESCAPE '\\\\')");
    params.push(term, term, term);
  }
  if (f.destinationId) { clauses.push("t.destination_id = ?"); params.push(f.destinationId); }
  if (f.destination) { clauses.push("t.destination LIKE ?"); params.push(`%${f.destination}%`); }
  if (f.categoryId) {
    clauses.push(`EXISTS (SELECT 1 FROM tour_category_assignments ca
      JOIN tour_categories c ON c.id = ca.category_id AND c.status = 'active'
      WHERE ca.tour_id = t.id AND ca.category_id = ?)`);
    params.push(f.categoryId);
  }
  if (f.tagId) {
    clauses.push(`EXISTS (SELECT 1 FROM tour_tag_assignments ta
      JOIN tour_tags tg ON tg.id = ta.tag_id AND tg.status = 'active'
      WHERE ta.tour_id = t.id AND ta.tag_id = ?)`);
    params.push(f.tagId);
  }
  if (f.minDuration !== undefined) { clauses.push("t.duration_days >= ?"); params.push(f.minDuration); }
  if (f.maxDuration !== undefined) { clauses.push("t.duration_days <= ?"); params.push(f.maxDuration); }
  if (f.minPrice !== undefined) { clauses.push("t.base_price >= ?"); params.push(f.minPrice); }
  if (f.maxPrice !== undefined) { clauses.push("t.base_price <= ?"); params.push(f.maxPrice); }
  const hasDepartureFilter = !!(f.departureFrom || f.departureTo || f.availableOnly || f.sort === "departure_soon");
  if (hasDepartureFilter) {
    const dep = ["d.tour_id = t.id", "d.status = 'scheduled'"];
    if (f.departureFrom) { dep.push("d.starts_at >= ?"); params.push(`${f.departureFrom} 00:00:00`); }
    if (f.departureTo) { dep.push("d.starts_at < DATE_ADD(?, INTERVAL 1 DAY)"); params.push(`${f.departureTo} 00:00:00`); }
    if (f.availableOnly) dep.push("(d.seat_capacity > d.seats_reserved)");
    clauses.push(`EXISTS (SELECT 1 FROM tour_departures d WHERE ${dep.join(" AND ")})`);
  }
  return { sql: clauses.join(" AND "), params };
}
function orderBy(sort) {
  switch (sort) {
    case "price_asc": return "t.base_price ASC, t.id DESC";
    case "price_desc": return "t.base_price DESC, t.id DESC";
    case "duration_asc": return "t.duration_days ASC, t.id DESC";
    case "duration_desc": return "t.duration_days DESC, t.id DESC";
    case "newest": return "t.created_at DESC, t.id DESC";
    case "departure_soon": return "next_departure ASC, t.id DESC";
    default: return "t.updated_at DESC, t.id DESC";
  }
}
async function search(filters) {
  const { sql, params } = buildWhere(filters);
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM tours t WHERE ${sql}`, params);
  const order = orderBy(filters.sort);
  const query = `
    SELECT t.id, t.slug, t.title, t.summary, t.destination, t.destination_id,
      t.duration_days, t.base_price, t.currency_code, t.cover_image_url,
      t.created_at, t.updated_at,
      (SELECT MIN(d.starts_at) FROM tour_departures d
       WHERE d.tour_id = t.id AND d.status = 'scheduled'
         AND d.starts_at >= UTC_TIMESTAMP()
         AND d.seat_capacity > d.seats_reserved) AS next_departure,
      (SELECT MIN(d.price_override) FROM tour_departures d
       WHERE d.tour_id = t.id AND d.status = 'scheduled'
         AND d.starts_at >= UTC_TIMESTAMP()
         AND d.seat_capacity > d.seats_reserved
         AND d.price_override IS NOT NULL) AS lowest_departure_price,
      (SELECT GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ')
       FROM tour_category_assignments ca JOIN tour_categories c ON c.id = ca.category_id
       WHERE ca.tour_id = t.id AND c.status = 'active') AS categories,
      (SELECT GROUP_CONCAT(DISTINCT tg.name ORDER BY tg.name SEPARATOR ', ')
       FROM tour_tag_assignments ta JOIN tour_tags tg ON tg.id = ta.tag_id
       WHERE ta.tour_id = t.id AND tg.status = 'active') AS tags
    FROM tours t
    WHERE ${sql}
    ORDER BY ${order}
    LIMIT ? OFFSET ?`;
  const [rows] = await pool.execute(query, [...params, filters.limit, filters.offset]);
  return {
    items: rows,
    pagination: {
      page: filters.page, limit: filters.limit, total: Number(count.total),
      totalPages: Math.max(1, Math.ceil(Number(count.total) / filters.limit))
    }
  };
}
module.exports = { search };
