const { pool, withTransaction } = require("../../config/db");

function notFound(message) { const e = new Error(message); e.statusCode = 404; throw e; }
function conflict(message) { const e = new Error(message); e.statusCode = 409; throw e; }

async function listForTour(tourId, { from, to, availableOnly = false }) {
  const conditions = ["tour_id = ?"];
  const params = [tourId];
  if (from) { conditions.push("starts_at >= ?"); params.push(from); }
  if (to) { conditions.push("starts_at < DATE_ADD(?, INTERVAL 1 DAY)"); params.push(to); }
  if (availableOnly) conditions.push("seat_capacity > seats_reserved");
  const [rows] = await pool.execute(
    `SELECT id, tour_id, starts_at, ends_at, seat_capacity, seats_reserved,
      (seat_capacity - seats_reserved) AS seats_available, price_override, status
     FROM tour_departures WHERE ${conditions.join(" AND ")}
     ORDER BY starts_at ASC`, params
  );
  return rows;
}
async function create(data) {
  const [[tour]] = await pool.execute("SELECT id FROM tours WHERE id = ? AND deleted_at IS NULL", [data.tourId]);
  if (!tour) notFound("Tour not found");
  const [result] = await pool.execute(
    `INSERT INTO tour_departures
      (tour_id, starts_at, ends_at, seat_capacity, seats_reserved, price_override, status)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [data.tourId, data.startsAt, data.endsAt, data.seatCapacity, data.priceOverride, data.status]
  );
  const [[row]] = await pool.execute("SELECT * FROM tour_departures WHERE id = ?", [result.insertId]);
  return row;
}
async function update(id, changes) {
  return withTransaction(async (conn) => {
    const [[row]] = await conn.execute("SELECT * FROM tour_departures WHERE id = ? FOR UPDATE", [id]);
    if (!row) notFound("Departure not found");
    const startsAt = changes.startsAt || row.starts_at;
    const endsAt = changes.endsAt || row.ends_at;
    const capacity = changes.seatCapacity ?? row.seat_capacity;
    const status = changes.status || row.status;
    if (new Date(endsAt) <= new Date(startsAt)) conflict("Departure end must be later than its start");
    if (capacity < row.seats_reserved) conflict("Seat capacity cannot be lower than seats already reserved");
    if (status === "cancelled" && row.seats_reserved > 0) {
      conflict("Cannot cancel a departure with reserved seats; resolve affected bookings first");
    }
    const assignments = [], values = [];
    for (const [key, column] of [
      ["startsAt", "starts_at"], ["endsAt", "ends_at"], ["seatCapacity", "seat_capacity"],
      ["priceOverride", "price_override"], ["status", "status"]
    ]) {
      if (changes[key] !== undefined) { assignments.push(`${column} = ?`); values.push(changes[key]); }
    }
    if (assignments.length) await conn.execute(
      `UPDATE tour_departures SET ${assignments.join(", ")} WHERE id = ?`, [...values, id]
    );
    const [[updated]] = await conn.execute("SELECT * FROM tour_departures WHERE id = ?", [id]);
    return updated;
  });
}
async function remove(id) {
  return withTransaction(async (conn) => {
    const [[row]] = await conn.execute("SELECT * FROM tour_departures WHERE id = ? FOR UPDATE", [id]);
    if (!row) notFound("Departure not found");
    if (row.seats_reserved > 0) conflict("Cannot delete a departure with reserved seats");
    await conn.execute("DELETE FROM tour_departures WHERE id = ?", [id]);
  });
}
async function availability(id) {
  const [[row]] = await pool.execute(
    `SELECT d.id, d.tour_id, d.starts_at, d.ends_at, d.seat_capacity, d.seats_reserved,
      GREATEST(d.seat_capacity - d.seats_reserved, 0) AS seats_available,
      d.price_override, t.base_price, t.currency_code
     FROM tour_departures d JOIN tours t ON t.id = d.tour_id
     WHERE d.id = ? AND d.status = 'scheduled' AND t.status = 'published'
       AND t.deleted_at IS NULL`, [id]
  );
  if (!row) notFound("Scheduled departure not found");
  return row;
}
module.exports = { listForTour, create, update, remove, availability };
