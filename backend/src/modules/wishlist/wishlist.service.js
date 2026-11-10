const { pool } = require("../../config/db");

async function list(userId, { page, limit, offset }) {
  const [items] = await pool.execute(
    `SELECT t.id AS tour_id, t.slug, t.title, t.summary, t.destination,
            t.duration_days, t.base_price, t.currency_code, t.cover_image_url,
            w.created_at AS added_at
       FROM wishlist_items w
       JOIN tours t ON t.id = w.tour_id
      WHERE w.user_id = ? AND t.deleted_at IS NULL
      ORDER BY w.created_at DESC, w.id DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM wishlist_items w
       JOIN tours t ON t.id = w.tour_id
      WHERE w.user_id = ? AND t.deleted_at IS NULL`,
    [userId]
  );
  const total = Number(count.total);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function add(userId, tourId) {
  const [[tour]] = await pool.execute(
    "SELECT id FROM tours WHERE id = ? AND status = 'published' AND deleted_at IS NULL",
    [tourId]
  );
  if (!tour) {
    const error = new Error("Tour not found");
    error.statusCode = 404;
    throw error;
  }
  await pool.execute(
    `INSERT INTO wishlist_items (user_id, tour_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [userId, tourId]
  );
  return { tourId, added: true };
}

async function remove(userId, tourId) {
  const [result] = await pool.execute(
    "DELETE FROM wishlist_items WHERE user_id = ? AND tour_id = ?",
    [userId, tourId]
  );
  return { tourId, removed: result.affectedRows > 0 };
}

async function contains(userId, tourId) {
  const [[row]] = await pool.execute(
    "SELECT 1 AS saved FROM wishlist_items WHERE user_id = ? AND tour_id = ?",
    [userId, tourId]
  );
  return { tourId, contains: Boolean(row) };
}

module.exports = { list, add, remove, contains };