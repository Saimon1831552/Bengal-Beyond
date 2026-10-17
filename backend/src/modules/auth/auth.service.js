const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AppError = require("../../utils/appError");
const env = require("../../config/env");
const { hashPassword, verifyPassword, isLegacyPasswordHash } = require("../../utils/password");
const repo = require("./auth.repository");

const REFRESH_TTL_DAYS = 30;
const ACCESS_TTL = "15m";
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

function createAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), typ: "access" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL, issuer: "bengal-beyond-api", audience: "bengal-beyond-client" },
  );
}

function newRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function refreshExpiry() {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function sessionUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    nationality: user.nationality,
    accountStatus: user.account_status,
    emailVerifiedAt: user.email_verified_at,
  };
}

async function issueSession(user, req) {
  const refreshToken = newRefreshToken();
  await repo.saveRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiry(),
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });
  return { accessToken: createAccessToken(user), refreshToken, user: sessionUser(user) };
}

async function register(input, req) {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) throw AppError.conflict("An account with this email already exists.", undefined, "EMAIL_IN_USE");
  const passwordHash = await hashPassword(input.password);
  const id = await repo.createCustomer({ ...input, passwordHash });
  const user = await repo.findPublicUserById(id);
  return issueSession(user, req);
}

async function login({ email, password }, req) {
  const user = await repo.findUserByEmail(email);
  const passwordMatches = await verifyPassword(user?.password_hash, password);

  if (!user || !passwordMatches) {
    throw AppError.unauthorized("Email or password is incorrect.", "INVALID_CREDENTIALS");
  }
  if (user.account_status !== "active") {
    throw AppError.forbidden("This account is not active.", "ACCOUNT_NOT_ACTIVE");
  }
  if (isLegacyPasswordHash(user.password_hash)) {
    await repo.updatePasswordHash(user.id, await hashPassword(password));
  }
  await repo.touchLastLogin(user.id);
  return issueSession(user, req);
}

async function refresh(rawToken, req) {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length > 200) {
    throw AppError.unauthorized("Refresh token is missing or invalid.", "INVALID_REFRESH_TOKEN");
  }
  const replacement = newRefreshToken();
  const userId = await repo.rotateRefreshToken({
    oldHash: hashToken(rawToken),
    newHash: hashToken(replacement),
    expiresAt: refreshExpiry(),
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });
  if (!userId) throw AppError.unauthorized("Refresh token is expired or invalid.", "INVALID_REFRESH_TOKEN");
  const user = await repo.findPublicUserById(userId);
  if (!user || user.account_status !== "active") {
    await repo.revokeRefreshToken(hashToken(replacement));
    throw AppError.unauthorized("Session is no longer valid.", "INVALID_SESSION");
  }
  return { accessToken: createAccessToken(user), refreshToken: replacement, user: sessionUser(user) };
}

async function logout(rawToken) {
  if (rawToken && typeof rawToken === "string" && rawToken.length <= 200) {
    await repo.revokeRefreshToken(hashToken(rawToken));
  }
}

module.exports = { register, login, refresh, logout };
