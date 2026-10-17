const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { z } = require("zod");

const app = require("../src/app");
const { pool, closePool } = require("../src/config/db");
const AppError = require("../src/utils/appError");
const asyncHandler = require("../src/utils/asynchandler");
const requestId = require("../src/middleware/requestId");
const notFound = require("../src/middleware/notFound");
const validate = require("../src/middleware/validate");
const { errorHandler, mapKnownError, buildErrorBody } = require("../src/middleware/errorHandler");
const { idParams, paginationQuery } = require("../src/validators/common");
const { toOffset, paginationMeta } = require("../src/utils/pagination");
const { generateBookingReference } = require("../src/utils/reference");
const env = require("../src/config/env");

// Start any express app on a random port and return a fetch-like helper.
async function serve(expressApp) {
  const server = await new Promise((resolve) => {
    const s = expressApp.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => server.close(r)) };
}

after(async () => {
  await closePool();
});

test("GET /api/health is ok and sets X-Request-Id", async () => {
  const s = await serve(app);
  const res = await fetch(`${s.base}/api/health`);
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.status, "ok");
  assert.ok(res.headers.get("x-request-id"));
  await s.close();
});

test("GET /api/health/ready checks the database", async () => {
  const s = await serve(app);
  const res = await fetch(`${s.base}/api/health/ready`);
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.data.database, true);
  await s.close();
});

test("a safe incoming X-Request-Id is kept, an unsafe one replaced", async () => {
  const s = await serve(app);
  const good = await fetch(`${s.base}/api/health`, { headers: { "X-Request-Id": "abc-12345678" } });
  assert.equal(good.headers.get("x-request-id"), "abc-12345678");
  const bad = await fetch(`${s.base}/api/health`, { headers: { "X-Request-Id": "x y\"<script>" } });
  assert.notEqual(bad.headers.get("x-request-id"), 'x y"<script>');
  await s.close();
});

test("unknown route returns a JSON 404", async () => {
  const s = await serve(app);
  const res = await fetch(`${s.base}/api/nope`);
  const json = await res.json();
  assert.equal(res.status, 404);
  assert.equal(json.success, false);
  assert.equal(json.error.code, "ROUTE_NOT_FOUND");
  assert.ok(json.error.requestId);
  await s.close();
});

test("malformed JSON body returns 400 INVALID_JSON", async () => {
  const s = await serve(app);
  const res = await fetch(`${s.base}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  const json = await res.json();
  assert.equal(res.status, 400);
  assert.equal(json.error.code, "INVALID_JSON");
  await s.close();
});

test("validate(): coerces, applies defaults, and reports field errors", async () => {
  const mini = express();
  mini.use(requestId, express.json());
  mini.post(
    "/items/:id",
    validate({
      params: idParams,
      query: paginationQuery,
      body: z.object({ name: z.string().trim().min(3) }),
    }),
    (req, res) => res.json(req.validated)
  );
  mini.use(notFound, errorHandler);

  const s = await serve(mini);
  const post = (path, body) =>
    fetch(`${s.base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const ok = await (await post("/items/7?limit=5", { name: "  Cox  " })).json();
  assert.deepEqual(ok, { params: { id: 7 }, query: { page: 1, limit: 5 }, body: { name: "Cox" } });

  const bad = await post("/items/abc?limit=500", { name: "x" });
  const badJson = await bad.json();
  assert.equal(bad.status, 422);
  assert.equal(badJson.error.code, "VALIDATION_ERROR");
  assert.ok(Array.isArray(badJson.error.details));
  await s.close();
});

test("asyncHandler forwards rejections; AppError status and code are kept", async () => {
  const mini = express();
  mini.use(requestId);
  mini.get("/boom", asyncHandler(async () => { throw AppError.forbidden(); }));
  mini.get("/bug", asyncHandler(async () => { throw new Error("secret internals"); }));
  mini.use(errorHandler);

  const s = await serve(mini);
  const a = await fetch(`${s.base}/boom`);
  assert.equal(a.status, 403);
  assert.equal((await a.json()).error.code, "FORBIDDEN");

  const b = await fetch(`${s.base}/bug`);
  assert.equal(b.status, 500);
  assert.equal((await b.json()).error.code, "INTERNAL_ERROR");
  await s.close();
});

test("500 messages are hidden in production, shown in development", () => {
  assert.equal(env.IS_PRODUCTION, env.NODE_ENV === "production");

  const err = new Error("secret internals");
  const prod = buildErrorBody(err, { requestId: "r1", isProduction: true });
  const dev = buildErrorBody(err, { requestId: "r1", isProduction: false });
  assert.equal(prod.body.error.message, "Something went wrong.");
  assert.equal(dev.body.error.message, "secret internals");
});

test("real database errors map to safe AppErrors", async () => {
  const run = async (sql) => {
    try { await pool.query(sql); } catch (e) { return mapKnownError(e); }
    return null;
  };

  const check = await run("UPDATE tour_departures SET seats_reserved = 999 WHERE id = 1");
  assert.equal(check.code, "CONSTRAINT_VIOLATION");
  assert.equal(check.statusCode, 422);

  const dup = await run("INSERT INTO roles (role_key, name) VALUES ('admin', 'Dup')");
  assert.equal(dup.code, "DUPLICATE_ENTRY");
  assert.equal(dup.statusCode, 409);

  const fk = await run("INSERT INTO tour_addons (tour_id, name, price) VALUES (99999, 'x', 1)");
  assert.equal(fk.code, "INVALID_REFERENCE");
  assert.equal(fk.statusCode, 400);

  assert.ok(!/UPDATE|INSERT/i.test(JSON.stringify(check)), "no SQL text leaks");
});

test("pagination helpers", () => {
  assert.deepEqual(toOffset({ page: 3, limit: 20 }), { limit: 20, offset: 40 });
  assert.deepEqual(paginationMeta({ page: 1, limit: 20, total: 0 }), { page: 1, limit: 20, total: 0, totalPages: 1 });
  assert.equal(paginationMeta({ page: 1, limit: 20, total: 41 }).totalPages, 3);
});

test("booking references: format, length limit, no ambiguous characters", () => {
  const seen = new Set();
  for (let i = 0; i < 500; i += 1) {
    const ref = generateBookingReference(new Date("2026-10-15T00:00:00Z"));
    assert.match(ref, /^BB-2610-[A-HJ-NP-Z2-9]{8}$/);
    assert.ok(ref.length <= 24);
    seen.add(ref);
  }
  assert.equal(seen.size, 500);
});