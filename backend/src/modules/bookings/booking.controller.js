const service = require("./booking.service");
function bad(message) { const e = new Error(message); e.statusCode = 400; return e; }
exports.createBooking = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.user_id);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });
    const key = req.get("Idempotency-Key");
    if (!key || key.length < 8 || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) throw bad("Provide a valid Idempotency-Key (8–128 characters)");
    const departureId = Number(req.body && req.body.departure_id);
    const quantity = Number(req.body && req.body.quantity);
    const travelers = req.body && req.body.travelers;
    const customerName = typeof req.body?.customer_name === "string" ? req.body.customer_name.trim() : "";
    const customerEmail = typeof req.body?.customer_email === "string" ? req.body.customer_email.trim().toLowerCase() : "";
    const customerPhone = typeof req.body?.customer_phone === "string" ? req.body.customer_phone.trim() : "";
    if (req.body?.customer_nationality != null && typeof req.body.customer_nationality !== "string") {
      throw bad("customer_nationality must be a string");
    }
    const customerNationality = typeof req.body?.customer_nationality === "string"
      ? req.body.customer_nationality.trim() || null
      : null;
    if (!Number.isSafeInteger(departureId) || departureId < 1) throw bad("departure_id must be a positive integer");
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) throw bad("quantity must be between 1 and 20");
    if (!customerName || customerName.length > 160) throw bad("customer_name is required and must be at most 160 characters");
    if (customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw bad("customer_email must be a valid email address");
    if (!customerPhone || customerPhone.length > 30) throw bad("customer_phone is required and must be at most 30 characters");
    if (customerNationality && customerNationality.length > 100) throw bad("customer_nationality must be at most 100 characters");
    if (!Array.isArray(travelers) || travelers.length !== quantity) throw bad("travelers length must equal quantity");
    const clean = travelers.map((t, i) => {
      if (!t || typeof t !== "object") throw bad(`Traveler ${i + 1} is invalid`);
      const traveler_name = typeof t.traveler_name === "string" ? t.traveler_name.trim() : "";
      const traveler_type = t.traveler_type || "adult";
      const nationality = t.nationality == null || t.nationality === "" ? null : String(t.nationality).trim();
      if (!traveler_name || traveler_name.length > 160) throw bad(`Traveler ${i + 1} has invalid traveler_name`);
      if (!["adult", "child", "infant"].includes(traveler_type)) throw bad(`Traveler ${i + 1} has invalid traveler_type`);
      if (nationality && nationality.length > 100) throw bad(`Traveler ${i + 1} nationality must be at most 100 characters`);
      return { traveler_name, traveler_type, nationality };
    });
    const result = await service.createBooking({
      userId: Number(userId),
      idempotencyKey: key,
      departureId,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      customerNationality,
      travelers: clean
    });
    res.status(result.replayed ? 200 : 201).json({ success: true, ...result });
  } catch (e) { next(e); }
};
