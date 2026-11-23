const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");

const conflict = (msg) => { throw AppError.conflict(msg); };
const bad = (msg) => { throw AppError.badRequest(msg, "VALIDATION_ERROR"); };

async function listByTour(tourId, { availableOnly = false } = {}) {
  const [tours] = await pool.execute("SELECT id FROM tours WHERE id = ? AND status = 'published' AND deleted_at IS NULL", [tourId]);
  if (!tours.length) throw AppError.notFound("Tour not found");
  const conditions = ["tour_id = ?", "status IN ('scheduled', 'sold_out')"];
  if (availableOnly) conditions.push("seat_capacity > seats_reserved");
  const [rows] = await pool.execute(
    `SELECT id, tour_id, starts_at, ends_at, seat_capacity, seats_reserved,
      GREATEST(CAST(seat_capacity AS SIGNED) - CAST(seats_reserved AS SIGNED), 0) AS seats_available,
      price_override, status
     FROM tour_departures WHERE ${conditions.join(" AND ")} ORDER BY starts_at ASC`,
    [tourId]
  );
  return rows;
}

async function create({ tour_id, starts_at, ends_at, seat_capacity, price_override, status = "scheduled" }) {
  const [tours] = await pool.execute("SELECT id FROM tours WHERE id = ? AND deleted_at IS NULL", [tour_id]);
  if (!tours.length) throw AppError.notFound("Tour not found");
  const [result] = await pool.execute(
    `INSERT INTO tour_departures
      (tour_id, starts_at, ends_at, seat_capacity, seats_reserved, price_override, status)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [tour_id, starts_at, ends_at || null, seat_capacity, price_override ?? null, status]
  );
  const [rows] = await pool.execute("SELECT * FROM tour_departures WHERE id = ?", [result.insertId]);
  return rows[0];
}

async function update(id, patch) {
  const [rows] = await pool.execute("SELECT * FROM tour_departures WHERE id = ?", [id]);
  if (!rows.length) throw AppError.notFound("Departure not found");
  const row = rows[0];
  const capacity = patch.seat_capacity ?? row.seat_capacity;
  const status = patch.status ?? row.status;
  if (capacity < row.seats_reserved) conflict("Seat capacity cannot be lower than seats already reserved");
  if (status === "cancelled" && row.seats_reserved > 0) {
    conflict("Cannot cancel a departure with reserved seats");
  }
  const fields = [];
  const values = [];
  for (const key of ["starts_at", "ends_at", "seat_capacity", "price_override", "status"]) {
    if (patch[key] !== undefined) { fields.push(`${key} = ?`); values.push(patch[key]); }
  }
  if (!fields.length) return row;
  values.push(id);
  await pool.execute(`UPDATE tour_departures SET ${fields.join(", ")} WHERE id = ?`, values);
  const [updated] = await pool.execute("SELECT * FROM tour_departures WHERE id = ?", [id]);
  return updated[0];
}

async function remove(id) {
  const [rows] = await pool.execute("SELECT * FROM tour_departures WHERE id = ?", [id]);
  if (!rows.length) throw AppError.notFound("Departure not found");
  if (rows[0].seats_reserved > 0) conflict("Cannot delete a departure with reserved seats");
  await pool.execute("DELETE FROM tour_departures WHERE id = ?", [id]);
  return { deleted: true };
}

async function listCalendar({ from, to, tourId } = {}) {
  const conditions = [];
  const params = [];
  if (from) { conditions.push("d.starts_at >= ?"); params.push(from); }
  if (to) { conditions.push("d.starts_at <= ?"); params.push(to); }
  if (tourId) { conditions.push("d.tour_id = ?"); params.push(tourId); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT d.id, d.tour_id, d.starts_at, d.ends_at, d.seat_capacity, d.seats_reserved,
      GREATEST(CAST(d.seat_capacity AS SIGNED) - CAST(d.seats_reserved AS SIGNED), 0) AS seats_available,
      d.price_override, d.status, t.title AS tour_title, t.slug AS tour_slug, t.currency_code
     FROM tour_departures d
     JOIN tours t ON t.id = d.tour_id AND t.deleted_at IS NULL
     ${where}
     ORDER BY d.starts_at ASC`,
    params
  );
  return rows;
}

module.exports = { listByTour, create, update, remove, listCalendar };