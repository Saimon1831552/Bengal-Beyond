const crypto = require("crypto");

// No 0/O/1/I so a reference can be read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// BB-2610-K7M2QX4P  (fits bookings.booking_reference varchar(24)).
// bookings.uq_bookings_reference is the real guarantee: on a duplicate-key
// error, generate a new one and retry.
function generateBookingReference(date = new Date()) {
  const yymm =
    String(date.getUTCFullYear()).slice(-2) +
    String(date.getUTCMonth() + 1).padStart(2, "0");

  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }

  return `BB-${yymm}-${suffix}`;
}

module.exports = { generateBookingReference };