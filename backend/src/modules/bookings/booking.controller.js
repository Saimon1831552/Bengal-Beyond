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
    if (!Number.isSafeInteger(departureId) || departureId < 1) throw bad("departure_id must be a positive integer");
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) throw bad("quantity must be between 1 and 20");
    if (!Array.isArray(travelers) || travelers.length !== quantity) throw bad("travelers length must equal quantity");
    const clean = travelers.map((t, i) => {
      if (!t || typeof t !== "object") throw bad(`Traveler ${i + 1} is invalid`);
      const full_name = typeof t.full_name === "string" ? t.full_name.trim() : "";
      const email = typeof t.email === "string" ? t.email.trim().toLowerCase() : "";
      const phone = typeof t.phone === "string" ? t.phone.trim() : "";
      if (!full_name || full_name.length > 160) throw bad(`Traveler ${i + 1} has invalid name`);
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad(`Traveler ${i + 1} has invalid email`);
      if (!phone || phone.length > 32) throw bad(`Traveler ${i + 1} has invalid phone`);
      return { full_name, email, phone };
    });
    const result = await service.createBooking({ userId: Number(userId), idempotencyKey: key, departureId, quantity, travelers: clean });
    res.status(result.replayed ? 200 : 201).json({ success: true, ...result });
  } catch (e) { next(e); }
};
