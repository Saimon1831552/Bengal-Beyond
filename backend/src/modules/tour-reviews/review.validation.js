function fail(message) { const e = new Error(message); e.statusCode = 400; throw e; }
function id(value, field) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(`${field} must be a positive integer`);
  return n;
}
function createReview(body) {
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail("rating must be an integer from 1 to 5");
  const reviewText = body.reviewText === undefined || body.reviewText === null ? null : String(body.reviewText).trim();
  if (reviewText && reviewText.length > 5000) fail("reviewText must be at most 5000 characters");
  if (body.bookingId === undefined || body.bookingId === null) fail("bookingId is required");
  return { rating, reviewText: reviewText || null, bookingId: id(body.bookingId, "bookingId") };
}
function moderation(body) {
  const out = {};
  if (body.status !== undefined) {
    if (!["published", "rejected"].includes(body.status)) fail("status must be published or rejected");
    out.status = body.status;
  }
  if (body.adminReply !== undefined) {
    if (body.adminReply !== null && typeof body.adminReply !== "string") fail("adminReply must be a string or null");
    if (typeof body.adminReply === "string" && body.adminReply.length > 5000) fail("adminReply must be at most 5000 characters");
    out.adminReply = body.adminReply;
  }
  if (!Object.keys(out).length) fail("Provide status or adminReply");
  return out;
}
module.exports = { id, createReview, moderation };
