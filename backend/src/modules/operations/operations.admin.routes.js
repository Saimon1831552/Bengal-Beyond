const express = require("express");
const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();
router.use(authenticate);

/* ============================================================================
 * 1. TOUR GUIDES / STAFF OPERATORS  (/api/admin/guides)
 * Reads users who hold staff/guide roles (role_key != 'customer') + assignment counts
 * ========================================================================== */
router.get(
  "/guides",
  authorize("tours.read"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.nationality, u.account_status, u.last_login_at,
              GROUP_CONCAT(DISTINCT r.name ORDER BY r.id SEPARATOR ', ') AS roles,
              GROUP_CONCAT(DISTINCT r.role_key ORDER BY r.id SEPARATOR ',') AS role_keys,
              COUNT(DISTINCT sa.id) AS active_assignments
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         LEFT JOIN staff_assignments sa ON sa.staff_user_id = u.id
        WHERE r.role_key <> 'customer'
        GROUP BY u.id
        ORDER BY FIELD(MIN(r.role_key), 'tour_operator') DESC, u.full_name ASC`
    );
    return sendSuccess(res, rows);
  })
);

/* ============================================================================
 * 2. STAFF & TOUR ASSIGNMENTS  (/api/admin/assignments)
 * Uses existing `staff_assignments` table ('booking' | 'enquiry' | 'tour')
 * ========================================================================== */
router.get(
  "/assignments",
  authorize("staff.assign"),
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.entity_type) {
      where.push("sa.entity_type = ?");
      params.push(req.query.entity_type);
    }
    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `SELECT sa.id, sa.entity_type, sa.entity_id, sa.staff_user_id, sa.created_at,
              staff.full_name AS staff_name, staff.email AS staff_email, staff.phone AS staff_phone,
              assigner.full_name AS assigned_by_name,
              CASE
                WHEN sa.entity_type = 'tour' THEN t.title
                WHEN sa.entity_type = 'booking' THEN CONCAT(b.booking_reference, ' — ', b.customer_name)
                WHEN sa.entity_type = 'enquiry' THEN CONCAT('Enquiry #', e.id, ' — ', e.name)
                ELSE CONCAT(sa.entity_type, ' #', sa.entity_id)
              END AS entity_label
         FROM staff_assignments sa
         JOIN users staff ON staff.id = sa.staff_user_id
         LEFT JOIN users assigner ON assigner.id = sa.assigned_by
         LEFT JOIN tours t ON sa.entity_type = 'tour' AND t.id = sa.entity_id
         LEFT JOIN bookings b ON sa.entity_type = 'booking' AND b.id = sa.entity_id
         LEFT JOIN tour_enquiries e ON sa.entity_type = 'enquiry' AND e.id = sa.entity_id
        ${sqlWhere}
        ORDER BY sa.created_at DESC, sa.id DESC`,
      params
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/assignments",
  authorize("staff.assign"),
  asyncHandler(async (req, res) => {
    const { entity_type, entity_id, staff_user_id } = req.body;
    if (!["booking", "enquiry", "tour"].includes(entity_type) || !entity_id || !staff_user_id) {
      throw AppError.badRequest("entity_type (booking|enquiry|tour), entity_id, and staff_user_id are required.", "VALIDATION_ERROR");
    }
    try {
      const [result] = await pool.execute(
        `INSERT INTO staff_assignments (entity_type, entity_id, staff_user_id, assigned_by)
         VALUES (?, ?, ?, ?)`,
        [entity_type, Number(entity_id), Number(staff_user_id), req.auth.userId]
      );
      return sendSuccess(res, { id: result.insertId }, { status: 201 });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        throw AppError.conflict("This staff member is already assigned to that record.");
      }
      throw err;
    }
  })
);

router.delete(
  "/assignments/:id",
  authorize("staff.assign"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM staff_assignments WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Assignment not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 3. VEHICLES & TRANSPORT  (/api/admin/vehicles)
 * ========================================================================== */
const VEHICLE_TYPES = ["sedan", "suv", "microbus", "tourist_coach", "boat", "other"];
const VEHICLE_STATUSES = ["available", "in_service", "maintenance", "inactive"];

router.get(
  "/vehicles",
  authorize("tours.read"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM vehicles ORDER BY status ASC, name ASC`);
    return sendSuccess(res, rows);
  })
);

router.post(
  "/vehicles",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const {
      name,
      vehicle_type = "microbus",
      registration_number,
      seat_capacity = 4,
      driver_name = null,
      driver_phone = null,
      daily_rate = 0,
      status = "available",
      notes = null,
    } = req.body;

    if (!name || !registration_number) {
      throw AppError.badRequest("name and registration_number are required.", "VALIDATION_ERROR");
    }
    if (!VEHICLE_TYPES.includes(vehicle_type) || !VEHICLE_STATUSES.includes(status)) {
      throw AppError.badRequest("Invalid vehicle_type or status.", "VALIDATION_ERROR");
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO vehicles (name, vehicle_type, registration_number, seat_capacity, driver_name, driver_phone, daily_rate, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(name).trim(),
          vehicle_type,
          String(registration_number).trim().toUpperCase(),
          Number(seat_capacity) || 4,
          driver_name || null,
          driver_phone || null,
          Number(daily_rate) || 0,
          status,
          notes || null,
        ]
      );
      const [[created]] = await pool.execute(`SELECT * FROM vehicles WHERE id = ?`, [result.insertId]);
      return sendSuccess(res, created, { status: 201 });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        throw AppError.conflict("A vehicle with this registration number already exists.");
      }
      throw err;
    }
  })
);

router.patch(
  "/vehicles/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, vehicle_type, registration_number, seat_capacity, driver_name, driver_phone, daily_rate, status, notes } = req.body;
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push("name = ?"); params.push(String(name).trim()); }
    if (vehicle_type !== undefined) { fields.push("vehicle_type = ?"); params.push(vehicle_type); }
    if (registration_number !== undefined) { fields.push("registration_number = ?"); params.push(String(registration_number).trim().toUpperCase()); }
    if (seat_capacity !== undefined) { fields.push("seat_capacity = ?"); params.push(Number(seat_capacity)); }
    if (driver_name !== undefined) { fields.push("driver_name = ?"); params.push(driver_name || null); }
    if (driver_phone !== undefined) { fields.push("driver_phone = ?"); params.push(driver_phone || null); }
    if (daily_rate !== undefined) { fields.push("daily_rate = ?"); params.push(Number(daily_rate)); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }
    if (notes !== undefined) { fields.push("notes = ?"); params.push(notes || null); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE vehicles SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Vehicle not found.");
    const [[updated]] = await pool.execute(`SELECT * FROM vehicles WHERE id = ?`, [id]);
    return sendSuccess(res, updated);
  })
);

router.delete(
  "/vehicles/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM vehicles WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Vehicle not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 4. ACCOMMODATION  (/api/admin/accommodation)
 * ========================================================================== */
const PROP_TYPES = ["hotel", "resort", "eco_lodge", "boat_cabin", "guesthouse"];

router.get(
  "/accommodation",
  authorize("tours.read"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT a.*, d.name AS destination_name
         FROM accommodations a
         LEFT JOIN destinations d ON d.id = a.destination_id
        ORDER BY a.status ASC, a.name ASC`
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/accommodation",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const {
      destination_id = null,
      name,
      property_type = "hotel",
      star_rating = null,
      address = null,
      contact_person = null,
      contact_phone = null,
      nightly_rate = 0,
      status = "active",
      notes = null,
    } = req.body;

    if (!name) throw AppError.badRequest("Property name is required.", "VALIDATION_ERROR");
    if (!PROP_TYPES.includes(property_type)) {
      throw AppError.badRequest("Invalid property_type.", "VALIDATION_ERROR");
    }

    const [result] = await pool.execute(
      `INSERT INTO accommodations (destination_id, name, property_type, star_rating, address, contact_person, contact_phone, nightly_rate, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        destination_id ? Number(destination_id) : null,
        String(name).trim(),
        property_type,
        star_rating ? Number(star_rating) : null,
        address || null,
        contact_person || null,
        contact_phone || null,
        Number(nightly_rate) || 0,
        status === "inactive" ? "inactive" : "active",
        notes || null,
      ]
    );
    const [[created]] = await pool.execute(
      `SELECT a.*, d.name AS destination_name FROM accommodations a LEFT JOIN destinations d ON d.id = a.destination_id WHERE a.id = ?`,
      [result.insertId]
    );
    return sendSuccess(res, created, { status: 201 });
  })
);

router.patch(
  "/accommodation/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { destination_id, name, property_type, star_rating, address, contact_person, contact_phone, nightly_rate, status, notes } = req.body;
    const fields = [];
    const params = [];

    if (destination_id !== undefined) { fields.push("destination_id = ?"); params.push(destination_id ? Number(destination_id) : null); }
    if (name !== undefined) { fields.push("name = ?"); params.push(String(name).trim()); }
    if (property_type !== undefined) { fields.push("property_type = ?"); params.push(property_type); }
    if (star_rating !== undefined) { fields.push("star_rating = ?"); params.push(star_rating ? Number(star_rating) : null); }
    if (address !== undefined) { fields.push("address = ?"); params.push(address || null); }
    if (contact_person !== undefined) { fields.push("contact_person = ?"); params.push(contact_person || null); }
    if (contact_phone !== undefined) { fields.push("contact_phone = ?"); params.push(contact_phone || null); }
    if (nightly_rate !== undefined) { fields.push("nightly_rate = ?"); params.push(Number(nightly_rate)); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }
    if (notes !== undefined) { fields.push("notes = ?"); params.push(notes || null); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE accommodations SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Accommodation not found.");
    const [[updated]] = await pool.execute(
      `SELECT a.*, d.name AS destination_name FROM accommodations a LEFT JOIN destinations d ON d.id = a.destination_id WHERE a.id = ?`,
      [id]
    );
    return sendSuccess(res, updated);
  })
);

router.delete(
  "/accommodation/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM accommodations WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Accommodation not found.");
    return sendSuccess(res, { deleted: true });
  })
);

module.exports = router;