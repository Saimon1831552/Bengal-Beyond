const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../../src/config/db");
const customers = require("../../src/modules/customers/admin-customer.service");

test("admin customer queries use customer roles and the schema full_name column", async (t) => {
  const originalExecute = pool.execute;
  t.after(() => { pool.execute = originalExecute; });
  const queries = [];
  pool.execute = async (sql, params) => {
    queries.push({ sql, params });
    if (sql.startsWith("SELECT COUNT(*)")) return [[{ total: 1 }]];
    if (sql.includes("FROM bookings b WHERE b.user_id = ? ORDER BY")) return [[]];
    return [[{ id: 2, name: "Customer", email: "customer@example.com" }]];
  };

  await customers.list({ search: "customer", page: "1", limit: "20" });
  await customers.getById("2");

  const countQuery = queries[0];
  const listQuery = queries[1];
  const detailQuery = queries[2];
  assert.match(countQuery.sql, /EXISTS \(SELECT 1 FROM user_roles ur JOIN roles r ON r\.id = ur\.role_id WHERE ur\.user_id = u\.id AND r\.role_key = 'customer'\)/);
  assert.match(countQuery.sql, /\(u\.full_name LIKE \? OR u\.email LIKE \? OR u\.phone LIKE \?\)/);
  assert.deepEqual(countQuery.params, ["%customer%", "%customer%", "%customer%"]);
  assert.match(listQuery.sql, /u\.full_name AS name/);
  assert.match(detailQuery.sql, /u\.full_name AS name/);
});
