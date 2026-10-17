const { pool } = require("../../config/db");
const SELECT = `d.id, d.tour_id, t.title AS tour_title, t.slug AS tour_slug,
 d.starts_at, d.ends_at, d.seat_capacity, d.seats_reserved,
 GREATEST(d.seat_capacity - d.seats_reserved, 0) AS seats_available,
 d.price_override, d.status, d.created_at, d.updated_at`;

async function findById(id, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT ${SELECT} FROM tour_departures d JOIN tours t ON t.id = d.tour_id WHERE d.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}
async function tourExists(tourId, executor = pool) {
  const [rows] = await executor.execute("SELECT id FROM tours WHERE id = ? AND deleted_at IS NULL LIMIT 1", [tourId]);
  return Boolean(rows[0]);
}
async function list({ page, limit, tour_id, status, from, to }) {
  const where = []; const params = [];
  if (tour_id) { where.push("d.tour_id = ?"); params.push(tour_id); }
  if (status) { where.push("d.status = ?"); params.push(status); }
  if (from) { where.push("d.starts_at >= ?"); params.push(`${from} 00:00:00`); }
  if (to) { where.push("d.starts_at < DATE_ADD(?, INTERVAL 1 DAY)"); params.push(to); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM tour_departures d ${clause}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(`SELECT ${SELECT} FROM tour_departures d JOIN tours t ON t.id = d.tour_id ${clause} ORDER BY d.starts_at ASC, d.id ASC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { rows, total: Number(countRows[0].total) };
}
async function create(data) {
  const [result] = await pool.execute(
    "INSERT INTO tour_departures (tour_id, starts_at, ends_at, seat_capacity, price_override, status) VALUES (?, ?, ?, ?, ?, 'scheduled')",
    [data.tour_id, data.starts_at, data.ends_at ?? null, data.seat_capacity, data.price_override ?? null]);
  return findById(result.insertId);
}
async function update(id, data) {
  const fields = ["tour_id", "starts_at", "ends_at", "seat_capacity", "price_override"].filter((f) => Object.hasOwn(data, f));
  if (!fields.length) return findById(id);
  const assignments = fields.map((f) => `${f} = ?`);
  const values = fields.map((f) => data[f] ?? (f === "ends_at" || f === "price_override" ? null : data[f]));
  await pool.execute(`UPDATE tour_departures SET ${assignments.join(", ")} WHERE id = ?`, [...values, id]);
  return findById(id);
}
async function changeStatus(id, status) {
  await pool.execute("UPDATE tour_departures SET status = ? WHERE id = ?", [status, id]);
  return findById(id);
}
async function removeIfUnreserved(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute("SELECT seats_reserved FROM tour_departures WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) { await conn.rollback(); return { missing: true }; }
    if (Number(rows[0].seats_reserved) > 0) { await conn.rollback(); return { conflict: true }; }
    const [items] = await conn.execute("SELECT id FROM booking_items WHERE departure_id = ? LIMIT 1", [id]);
    if (items.length) { await conn.rollback(); return { conflict: true }; }
    await conn.execute("DELETE FROM tour_departures WHERE id = ?", [id]);
    await conn.commit(); return { deleted: true };
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}
module.exports = { findById, tourExists, list, create, update, changeStatus, removeIfUnreserved };
