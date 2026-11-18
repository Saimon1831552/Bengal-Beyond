const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mapKnownError, buildErrorBody } = require("../../src/middleware/errorHandler");

test("Zod validation errors map to HTTP 422 with field paths", () => {
  const error = Object.assign(new Error("Validation failed"), {
    name: "ZodError",
    issues: [
      { path: ["profile", "email"], message: "Invalid email" },
      { path: [], message: "Invalid request" },
    ],
  });

  const mapped = mapKnownError(error);
  assert.equal(mapped.statusCode, 422);
  assert.equal(mapped.code, "VALIDATION_ERROR");
  assert.deepEqual(mapped.details, [
    { path: "profile.email", message: "profile.email: Invalid email" },
    { path: "", message: "Invalid request" },
  ]);
  assert.equal(buildErrorBody(error, { requestId: "r1", isProduction: true }).status, 422);
});
