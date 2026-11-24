const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../../src/config/db");
const { search } = require("../../src/modules/tour-search/tour-search.service");

test("tour search applies departure filters to one future departure", async (t) => {
  const originalExecute = pool.execute;
  t.after(() => { pool.execute = originalExecute; });
  const executions = [];
  pool.execute = async (sql, params) => {
    executions.push({ sql, params });
    return sql.startsWith("SELECT COUNT") ? [[{ total: 0 }]] : [[]];
  };

  await search({
    page: 1,
    limit: 12,
    offset: 0,
    sort: "recommended",
    departureFrom: "2026-12-01",
    departureTo: "2026-12-10",
    minSeats: 4,
    guests: 2,
    availableOnly: true,
  });

  const countQuery = executions[0];
  assert.match(countQuery.sql, /d\.starts_at >= UTC_TIMESTAMP\(\)/);
  assert.match(countQuery.sql, /d\.starts_at >= \?/);
  assert.match(countQuery.sql, /d\.starts_at < DATE_ADD\(\?, INTERVAL 1 DAY\)/);
assert.match(countQuery.sql, /\(CAST\(d\.seat_capacity AS SIGNED\) - CAST\(d\.seats_reserved AS SIGNED\)\) >= \?/);  assert.match(countQuery.sql, /GREATEST\(/);
  assert.equal((countQuery.sql.match(/EXISTS \(SELECT 1 FROM tour_departures d WHERE/g) || []).length, 1);
  assert.deepEqual(countQuery.params, [
    "2026-12-01 00:00:00",
    "2026-12-10 00:00:00",
    4,
    2,
  ]);
});
