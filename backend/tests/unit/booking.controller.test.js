const { test } = require("node:test");
const assert = require("node:assert/strict");
const service = require("../../src/modules/bookings/booking.service");
const controller = require("../../src/modules/bookings/booking.controller");

test("booking creation accepts a guest and passes a null user id to the service", async (t) => {
  const originalCreateBooking = service.createBooking;
  let receivedPayload;
  service.createBooking = async (payload) => {
    receivedPayload = payload;
    return { replayed: false, booking: { id: 1 } };
  };
  t.after(() => { service.createBooking = originalCreateBooking; });

  const response = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const request = {
    user: null,
    get: () => "guest-booking-key-001",
    body: {
      departure_id: 12,
      quantity: 1,
      customer_name: "Guest Traveller",
      customer_email: "guest@example.com",
      customer_phone: "+880123456789",
      travelers: [{ traveler_name: "Guest Traveller", traveler_type: "adult" }],
    },
  };

  await controller.createBooking(request, response, (error) => { throw error; });

  assert.equal(receivedPayload.userId, null);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
});
