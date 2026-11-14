const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseSearchQuery } = require("../../src/modules/tour-search/tour-search.validation");

test("tour search parses guest counts and rejects invalid values", () => {
  assert.equal(parseSearchQuery({ guests: "4" }).guests, 4);
  assert.equal(parseSearchQuery({}).guests, undefined);
  assert.throws(() => parseSearchQuery({ guests: "0" }), /guests must be between 1 and 20/);
  assert.throws(() => parseSearchQuery({ guests: "21" }), /guests must be between 1 and 20/);
  assert.throws(() => parseSearchQuery({ guests: "1.5" }), /guests must be a positive integer/);
});
