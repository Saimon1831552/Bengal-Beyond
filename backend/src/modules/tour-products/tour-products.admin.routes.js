const express = require("express");
const { pool } = require("../../config/db");
const AppError = require("../../utils/appError");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();
router.use(authenticate);

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ============================================================================
 * 1. TOUR ADD-ONS  (/api/admin/tour-addons)
 * ========================================================================== */
router.get(
  "/tour-addons",
  authorize("tours.read"),
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.tour_id) {
      where.push("a.tour_id = ?");
      params.push(Number(req.query.tour_id));
    }
    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `SELECT a.*, t.title AS tour_title
         FROM tour_addons a
         JOIN tours t ON t.id = a.tour_id
        ${sqlWhere}
        ORDER BY a.tour_id ASC, a.id DESC`,
      params
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/tour-addons",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const { tour_id, name, description = null, price, pricing_mode = "per_person", is_active = 1 } = req.body;
    if (!tour_id || !name || price == null) {
      throw AppError.badRequest("tour_id, name, and price are required.", "VALIDATION_ERROR");
    }
    if (!["per_person", "per_booking"].includes(pricing_mode)) {
      throw AppError.badRequest("Invalid pricing_mode.", "VALIDATION_ERROR");
    }
    const [result] = await pool.execute(
      `INSERT INTO tour_addons (tour_id, name, description, price, pricing_mode, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(tour_id), String(name).trim(), description || null, Number(price), pricing_mode, is_active ? 1 : 0]
    );
    const [[created]] = await pool.execute(`SELECT * FROM tour_addons WHERE id = ?`, [result.insertId]);
    return sendSuccess(res, created, { status: 201 });
  })
);

router.patch(
  "/tour-addons/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, description, price, pricing_mode, is_active } = req.body;
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push("name = ?"); params.push(String(name).trim()); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description || null); }
    if (price !== undefined) { fields.push("price = ?"); params.push(Number(price)); }
    if (pricing_mode !== undefined) {
      if (!["per_person", "per_booking"].includes(pricing_mode)) {
        throw AppError.badRequest("Invalid pricing_mode.", "VALIDATION_ERROR");
      }
      fields.push("pricing_mode = ?");
      params.push(pricing_mode);
    }
    if (is_active !== undefined) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE tour_addons SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Tour add-on not found.");
    const [[updated]] = await pool.execute(`SELECT * FROM tour_addons WHERE id = ?`, [id]);
    return sendSuccess(res, updated);
  })
);

router.delete(
  "/tour-addons/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM tour_addons WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Tour add-on not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 2. TOUR ITINERARIES  (/api/admin/itineraries)
 * ========================================================================== */
router.get(
  "/itineraries",
  authorize("tours.read"),
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.tour_id) {
      where.push("i.tour_id = ?");
      params.push(Number(req.query.tour_id));
    }
    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `SELECT i.*, t.title AS tour_title
         FROM tour_itineraries i
         JOIN tours t ON t.id = i.tour_id
        ${sqlWhere}
        ORDER BY t.title ASC, i.day_number ASC`,
      params
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/itineraries",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const { tour_id, day_number, title, description, meals = null, accommodation_note = null } = req.body;
    if (!tour_id || !day_number || !title || !description) {
      throw AppError.badRequest("tour_id, day_number, title, and description are required.", "VALIDATION_ERROR");
    }
    try {
      const [result] = await pool.execute(
        `INSERT INTO tour_itineraries (tour_id, day_number, title, description, meals, accommodation_note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [Number(tour_id), Number(day_number), String(title).trim(), String(description).trim(), meals || null, accommodation_note || null]
      );
      const [[created]] = await pool.execute(
        `SELECT i.*, t.title AS tour_title FROM tour_itineraries i JOIN tours t ON t.id = i.tour_id WHERE i.id = ?`,
        [result.insertId]
      );
      return sendSuccess(res, created, { status: 201 });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        throw AppError.conflict(`Day ${day_number} already exists for this tour.`);
      }
      throw err;
    }
  })
);

router.patch(
  "/itineraries/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { tour_id, day_number, title, description, meals, accommodation_note } = req.body;
    const fields = [];
    const params = [];

    if (tour_id !== undefined) { fields.push("tour_id = ?"); params.push(Number(tour_id)); }
    if (day_number !== undefined) { fields.push("day_number = ?"); params.push(Number(day_number)); }
    if (title !== undefined) { fields.push("title = ?"); params.push(String(title).trim()); }
    if (description !== undefined) { fields.push("description = ?"); params.push(String(description).trim()); }
    if (meals !== undefined) { fields.push("meals = ?"); params.push(meals || null); }
    if (accommodation_note !== undefined) { fields.push("accommodation_note = ?"); params.push(accommodation_note || null); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    try {
      const [result] = await pool.execute(`UPDATE tour_itineraries SET ${fields.join(", ")} WHERE id = ?`, params);
      if (!result.affectedRows) throw AppError.notFound("Itinerary day not found.");
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        throw AppError.conflict("That day number already exists for the selected tour.");
      }
      throw err;
    }
    const [[updated]] = await pool.execute(
      `SELECT i.*, t.title AS tour_title FROM tour_itineraries i JOIN tours t ON t.id = i.tour_id WHERE i.id = ?`,
      [id]
    );
    return sendSuccess(res, updated);
  })
);

router.delete(
  "/itineraries/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM tour_itineraries WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Itinerary day not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 3. SEASONAL PRICING  (/api/admin/seasonal-pricing)
 * ========================================================================== */
router.get(
  "/seasonal-pricing",
  authorize("tours.read"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT sp.*, t.title AS tour_title
         FROM tour_seasonal_pricing sp
         LEFT JOIN tours t ON t.id = sp.tour_id
        ORDER BY sp.start_date DESC, sp.id DESC`
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/seasonal-pricing",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const {
      tour_id = null,
      name,
      start_date,
      end_date,
      adjustment_type = "percentage",
      adjustment_value,
      status = "active",
    } = req.body;

    if (!name || !start_date || !end_date || adjustment_value == null) {
      throw AppError.badRequest("name, start_date, end_date, and adjustment_value are required.", "VALIDATION_ERROR");
    }
    if (String(end_date) < String(start_date)) {
      throw AppError.badRequest("end_date must be on or after start_date.", "VALIDATION_ERROR");
    }
    if (!["percentage", "fixed"].includes(adjustment_type)) {
      throw AppError.badRequest("Invalid adjustment_type.", "VALIDATION_ERROR");
    }

    const [result] = await pool.execute(
      `INSERT INTO tour_seasonal_pricing (tour_id, name, start_date, end_date, adjustment_type, adjustment_value, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tour_id ? Number(tour_id) : null,
        String(name).trim(),
        start_date,
        end_date,
        adjustment_type,
        Number(adjustment_value),
        status === "inactive" ? "inactive" : "active",
      ]
    );
    const [[created]] = await pool.execute(
      `SELECT sp.*, t.title AS tour_title FROM tour_seasonal_pricing sp LEFT JOIN tours t ON t.id = sp.tour_id WHERE sp.id = ?`,
      [result.insertId]
    );
    return sendSuccess(res, created, { status: 201 });
  })
);

router.patch(
  "/seasonal-pricing/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { tour_id, name, start_date, end_date, adjustment_type, adjustment_value, status } = req.body;
    const fields = [];
    const params = [];

    if (tour_id !== undefined) { fields.push("tour_id = ?"); params.push(tour_id ? Number(tour_id) : null); }
    if (name !== undefined) { fields.push("name = ?"); params.push(String(name).trim()); }
    if (start_date !== undefined) { fields.push("start_date = ?"); params.push(start_date); }
    if (end_date !== undefined) { fields.push("end_date = ?"); params.push(end_date); }
    if (adjustment_type !== undefined) { fields.push("adjustment_type = ?"); params.push(adjustment_type); }
    if (adjustment_value !== undefined) { fields.push("adjustment_value = ?"); params.push(Number(adjustment_value)); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE tour_seasonal_pricing SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Seasonal pricing rule not found.");
    const [[updated]] = await pool.execute(
      `SELECT sp.*, t.title AS tour_title FROM tour_seasonal_pricing sp LEFT JOIN tours t ON t.id = sp.tour_id WHERE sp.id = ?`,
      [id]
    );
    return sendSuccess(res, updated);
  })
);

router.delete(
  "/seasonal-pricing/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM tour_seasonal_pricing WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Seasonal pricing rule not found.");
    return sendSuccess(res, { deleted: true });
  })
);

/* ============================================================================
 * 4. TOUR PACKAGES  (/api/admin/packages)
 * ========================================================================== */
router.get(
  "/packages",
  authorize("tours.read"),
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.tour_id) {
      where.push("p.tour_id = ?");
      params.push(Number(req.query.tour_id));
    }
    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `SELECT p.*, t.title AS tour_title
         FROM tour_packages p
         JOIN tours t ON t.id = p.tour_id
        ${sqlWhere}
        ORDER BY p.tour_id ASC, p.price_per_person ASC`,
      params
    );
    return sendSuccess(res, rows);
  })
);

router.post(
  "/packages",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const {
      tour_id,
      name,
      slug,
      description = null,
      price_per_person,
      min_travelers = 1,
      max_travelers = null,
      inclusions = [],
      status = "active",
    } = req.body;

    if (!tour_id || !name || price_per_person == null) {
      throw AppError.badRequest("tour_id, name, and price_per_person are required.", "VALIDATION_ERROR");
    }
    const finalSlug = slugify(slug || name);
    const inclusionsJson = JSON.stringify(
      Array.isArray(inclusions)
        ? inclusions
        : String(inclusions || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
    );

    try {
      const [result] = await pool.execute(
        `INSERT INTO tour_packages (tour_id, name, slug, description, price_per_person, min_travelers, max_travelers, inclusions_json, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(tour_id),
          String(name).trim(),
          finalSlug,
          description || null,
          Number(price_per_person),
          Number(min_travelers) || 1,
          max_travelers ? Number(max_travelers) : null,
          inclusionsJson,
          status === "inactive" ? "inactive" : "active",
        ]
      );
      const [[created]] = await pool.execute(
        `SELECT p.*, t.title AS tour_title FROM tour_packages p JOIN tours t ON t.id = p.tour_id WHERE p.id = ?`,
        [result.insertId]
      );
      return sendSuccess(res, created, { status: 201 });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        throw AppError.conflict("A package with this slug already exists for this tour.");
      }
      throw err;
    }
  })
);

router.patch(
  "/packages/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { tour_id, name, slug, description, price_per_person, min_travelers, max_travelers, inclusions, status } = req.body;
    const fields = [];
    const params = [];

    if (tour_id !== undefined) { fields.push("tour_id = ?"); params.push(Number(tour_id)); }
    if (name !== undefined) { fields.push("name = ?"); params.push(String(name).trim()); }
    if (slug !== undefined) { fields.push("slug = ?"); params.push(slugify(slug)); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description || null); }
    if (price_per_person !== undefined) { fields.push("price_per_person = ?"); params.push(Number(price_per_person)); }
    if (min_travelers !== undefined) { fields.push("min_travelers = ?"); params.push(Number(min_travelers) || 1); }
    if (max_travelers !== undefined) { fields.push("max_travelers = ?"); params.push(max_travelers ? Number(max_travelers) : null); }
    if (inclusions !== undefined) {
      const list = Array.isArray(inclusions)
        ? inclusions
        : String(inclusions || "").split("\n").map((s) => s.trim()).filter(Boolean);
      fields.push("inclusions_json = ?");
      params.push(JSON.stringify(list));
    }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }

    if (!fields.length) throw AppError.badRequest("No fields to update.", "VALIDATION_ERROR");
    params.push(id);

    const [result] = await pool.execute(`UPDATE tour_packages SET ${fields.join(", ")} WHERE id = ?`, params);
    if (!result.affectedRows) throw AppError.notFound("Tour package not found.");
    const [[updated]] = await pool.execute(
      `SELECT p.*, t.title AS tour_title FROM tour_packages p JOIN tours t ON t.id = p.tour_id WHERE p.id = ?`,
      [id]
    );
    return sendSuccess(res, updated);
  })
);

router.delete(
  "/packages/:id",
  authorize("tours.manage"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.execute(`DELETE FROM tour_packages WHERE id = ?`, [Number(req.params.id)]);
    if (!result.affectedRows) throw AppError.notFound("Tour package not found.");
    return sendSuccess(res, { deleted: true });
  })
);

module.exports = router;