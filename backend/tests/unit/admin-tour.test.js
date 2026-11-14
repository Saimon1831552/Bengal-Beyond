const { test } = require("node:test");
const assert = require("node:assert/strict");
const repository = require("../../src/modules/tours/admin-tour.repository");
const service = require("../../src/modules/tours/admin-tour.service");
const { listQuery } = require("../../src/modules/tours/admin-tour.schema");

test("admin tour list query parses pagination, search, and status filters", () => {
  assert.deepEqual(listQuery.parse({ page: "2", limit: "10", q: " tea ", status: "draft" }), {
    page: 2,
    limit: 10,
    q: "tea",
    status: "draft",
  });
  assert.deepEqual(listQuery.parse({}), { page: 1, limit: 20 });
  assert.throws(() => listQuery.parse({ status: "deleted" }));
  assert.throws(() => listQuery.parse({ unexpected: "value" }));
});

test("admin tour list includes pagination metadata", async (t) => {
  const originalListAll = repository.listAll;
  t.after(() => { repository.listAll = originalListAll; });
  repository.listAll = async (query) => {
    assert.deepEqual(query, { page: 2, limit: 10, q: "tea", offset: 10 });
    return { rows: [{ id: 8, status: "draft" }], total: 21 };
  };

  assert.deepEqual(await service.listTours({ page: 2, limit: 10, q: "tea" }), {
    rows: [{ id: 8, status: "draft" }],
    meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
  });
});

test("admin tour detail returns a not-found error for missing tours", async (t) => {
  const originalFindById = repository.findById;
  t.after(() => { repository.findById = originalFindById; });
  repository.findById = async () => null;

  await assert.rejects(service.getTour(42), (error) =>
    error.statusCode === 404 && error.code === "TOUR_NOT_FOUND"
  );
});

test("admin tour create and destination update synchronize destination IDs", async (t) => {
  const originals = {
    findById: repository.findById,
    findBySlug: repository.findBySlug,
    create: repository.create,
    update: repository.update,
    syncDestination: repository.syncDestination,
  };
  t.after(() => Object.assign(repository, originals));

  const synced = [];
  repository.findBySlug = async () => null;
  repository.create = async () => ({ id: 7, destination_id: null });
  repository.update = async () => ({ id: 7, destination_id: null });
  repository.syncDestination = async (id) => { synced.push(id); };
  repository.findById = async () => ({ id: 7, destination_id: null });

  const created = await service.createTour({
    title: "Test tour",
    destination: "Sylhet",
    duration_days: 2,
    base_price: 10,
    currency_code: "USD",
  }, 1);
  const updated = await service.updateTour(7, { destination: "Sylhet" }, 1);

  assert.deepEqual(created, { id: 7, destination_id: null });
  assert.deepEqual(updated, { id: 7, destination_id: null });
  assert.deepEqual(synced, [7, 7]);
});
