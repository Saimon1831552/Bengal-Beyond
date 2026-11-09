const { pool } = require('../../config/db');

const SELECT = `SELECT id, tour_id, title, media_url, alt_text, sort_order, status, created_by, created_at FROM gallery_items`;

async function listPublic({ page, limit, tourId }) {
  const where = ['status = ?'];
  const params = ['published'];
  if (tourId) { where.push('tour_id = ?'); params.push(tourId); }
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `${SELECT} WHERE ${where.join(' AND ')} ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM gallery_items WHERE ${where.join(' AND ')}`, params);
  return { items: rows, pagination: { page, limit, total: Number(count.total), pages: Math.ceil(Number(count.total) / limit) } };
}

async function listAdmin({ page, limit, status, tourId }) {
  const where = ['1=1']; const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (tourId) { where.push('tour_id = ?'); params.push(tourId); }
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM gallery_items WHERE ${where.join(' AND ')}`, params);
  return { items: rows, pagination: { page, limit, total: Number(count.total), pages: Math.ceil(Number(count.total) / limit) } };
}

async function create(data, userId) {
  const [result] = await pool.execute(
    `INSERT INTO gallery_items (tour_id,title,media_url,alt_text,sort_order,status,created_by) VALUES (?,?,?,?,?,?,?)`,
    [data.tour_id ?? null, data.title ?? null, data.media_url, data.alt_text ?? null, data.sort_order ?? 0, data.status ?? 'draft', userId ?? null]
  );
  return getById(result.insertId);
}
async function getById(id) {
  const [rows] = await pool.execute(`${SELECT} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}
async function update(id, data) {
  const fields = ['tour_id','title','media_url','alt_text','sort_order','status'];
  const sets = []; const values = [];
  for (const field of fields) if (Object.prototype.hasOwnProperty.call(data, field)) { sets.push(`${field} = ?`); values.push(data[field]); }
  if (!sets.length) return getById(id);
  await pool.execute(`UPDATE gallery_items SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  return getById(id);
}
async function remove(id) { const [result] = await pool.execute('DELETE FROM gallery_items WHERE id = ?', [id]); return result.affectedRows > 0; }
module.exports = { listPublic, listAdmin, create, getById, update, remove };
