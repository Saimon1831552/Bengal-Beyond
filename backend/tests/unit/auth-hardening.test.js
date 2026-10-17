const { test } = require("node:test");
const assert = require("node:assert/strict");
const argon2 = require("argon2");
const bcrypt = require("bcryptjs");
const authRepository = require("../../src/modules/auth/auth.repository");
const authService = require("../../src/modules/auth/auth.service");
const adminTourRepository = require("../../src/modules/tours/admin-tour.repository");
const adminTourService = require("../../src/modules/tours/admin-tour.service");
const authRateLimits = require("../../src/middleware/authRateLimit");
const env = require("../../src/config/env");
const app = require("../../src/app");
const lifecycleRepository = require("../../src/modules/auth/lifecycle.repository");
const lifecycleService = require("../../src/modules/auth/lifecycle.service");
const mailer = require("../../src/services/mailer");
const logger = require("../../src/utils/logger");
const { hashPassword, verifyPassword } = require("../../src/utils/password");

test("new passwords use the asynchronous Argon2id hash format", async () => {
  const password = "a-new-password-that-is-long-enough";
  const passwordHash = await hashPassword(password);
  assert.match(passwordHash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(passwordHash, password), true);
});

test("each auth endpoint has an independent rate limiter", () => {
  const instances = Object.values(authRateLimits);
  assert.equal(new Set(instances).size, instances.length);
});

test("Express trusts only the configured number of proxy hops", () => {
  assert.equal(app.get("trust proxy"), env.TRUST_PROXY_HOPS || false);
});

test("unknown login performs a dummy password verification", async (t) => {
  const { pool } = require("../../src/config/db");
  const original = authRepository.findUserByEmail;
  const originalExecute = pool.execute;
  t.after(() => {
    authRepository.findUserByEmail = original;
    pool.execute = originalExecute;
  });
  authRepository.findUserByEmail = async () => null;
  pool.execute = async () => [{ affectedRows: 1 }];

  await assert.rejects(
    authService.login({ email: "unknown@example.com", password: "some-valid-password" }, {}),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("refresh-token reuse is recorded as a security event and remains unauthorized", async (t) => {
  const { pool } = require("../../src/config/db");
  const originalExecute = pool.execute;
  const originalRotate = authRepository.rotateRefreshToken;
  let auditParams;
  t.after(() => {
    pool.execute = originalExecute;
    authRepository.rotateRefreshToken = originalRotate;
  });
  pool.execute = async (_sql, params) => { auditParams = params; return [{ affectedRows: 1 }]; };
  authRepository.rotateRefreshToken = async () => ({
    userId: null,
    reason: "token_reuse",
    affectedUserId: 73,
  });

  await assert.rejects(
    authService.refresh("revoked-refresh-token", { get: () => "test-agent", ip: "127.0.0.1" }),
    (error) => error.code === "INVALID_REFRESH_TOKEN",
  );
  assert.equal(auditParams[1], "auth.refresh.reuse_detected");
  assert.equal(auditParams[2], 73);
});

test("successful legacy bcrypt login upgrades its password hash", async (t) => {
  const { pool } = require("../../src/config/db");
  const originalExecute = pool.execute;
  const originals = {
    findUserByEmail: authRepository.findUserByEmail,
    updatePasswordHash: authRepository.updatePasswordHash,
    touchLastLogin: authRepository.touchLastLogin,
    saveRefreshToken: authRepository.saveRefreshToken,
  };
  t.after(() => {
    Object.assign(authRepository, originals);
    pool.execute = originalExecute;
  });

  const password = "legacy-password-that-is-long-enough";
  const user = {
    id: 42,
    email: "legacy@example.com",
    password_hash: bcrypt.hashSync(password, 4),
    account_status: "active",
    full_name: "Legacy User",
    phone: null,
    nationality: null,
    email_verified_at: null,
  };
  let upgradedHash;
  authRepository.findUserByEmail = async () => user;
  authRepository.updatePasswordHash = async (_userId, passwordHash) => { upgradedHash = passwordHash; };
  authRepository.touchLastLogin = async () => {};
  authRepository.saveRefreshToken = async () => {};
  pool.execute = async () => [{ affectedRows: 1 }];

  const session = await authService.login({ email: user.email, password }, {
    get: () => "test-agent",
    ip: "127.0.0.1",
  });

  assert.match(upgradedHash, /^\$argon2id\$/);
  assert.equal(await argon2.verify(upgradedHash, password), true);
  assert.ok(session.accessToken);
});

test("lifecycle requests return generically and log email delivery failures", async (t) => {
  const originals = {
    findUserByEmail: lifecycleRepository.findUserByEmail,
    createActionToken: lifecycleRepository.createActionToken,
    sendActionEmail: mailer.sendActionEmail,
    error: logger.error,
  };
  t.after(() => {
    lifecycleRepository.findUserByEmail = originals.findUserByEmail;
    lifecycleRepository.createActionToken = originals.createActionToken;
    mailer.sendActionEmail = originals.sendActionEmail;
    logger.error = originals.error;
  });

  let loggedFailure;
  lifecycleRepository.findUserByEmail = async () => ({
    id: 23,
    email: "eligible@example.com",
    account_status: "active",
    email_verified_at: null,
  });
  lifecycleRepository.createActionToken = async () => {};
  mailer.sendActionEmail = async () => { throw new Error("SMTP unavailable"); };
  logger.error = (message, fields) => { loggedFailure = { message, fields }; };

  const result = await lifecycleService.requestEmailVerification("eligible@example.com");
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(result.message, /If the account is eligible/);
  assert.equal(loggedFailure.message, "Account action email delivery failed");
  assert.equal(loggedFailure.fields.eventType, "email_verification");
});

test("editing a tour title does not change its slug", async (t) => {
  const originals = {
    findById: adminTourRepository.findById,
    update: adminTourRepository.update,
  };
  t.after(() => Object.assign(adminTourRepository, originals));

  let updateData;
  adminTourRepository.findById = async () => ({ id: 7, slug: "original-tour-title" });
  adminTourRepository.update = async (_id, data) => {
    updateData = data;
    return { id: 7, ...data };
  };

  await adminTourService.updateTour(7, { title: "!!" }, 3);
  assert.deepEqual(updateData, { title: "!!" });
});
