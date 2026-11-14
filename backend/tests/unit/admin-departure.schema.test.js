const { test } = require("node:test");
const assert = require("node:assert/strict");
const { updateDepartureBody } = require("../../src/modules/departures/admin-departure.schema");

test("departure price override preserves null and coerces numeric values", () => {
  assert.deepEqual(updateDepartureBody.parse({ price_override: null }), { price_override: null });
  assert.deepEqual(updateDepartureBody.parse({ price_override: "25.5" }), { price_override: 25.5 });
});
