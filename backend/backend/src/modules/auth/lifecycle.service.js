const crypto = require("crypto");
const AppError = require("../../utils/appError");
const env = require("../../config/env");
const { hashPassword } = require("../../utils/password");
const repo = require("./lifecycle.repository");
const mailer = require("../../services/mailer");
const logger = require("../../utils/logger");

const TOKEN_TTL_MINUTES = 30;
const hash = (raw) => crypto.createHash("sha256").update(raw).digest("hex");
const createRawToken = () => crypto.randomBytes(32).toString("base64url");
const expiry = () => new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
const publicMessage = "If the account is eligible, an email with further instructions will be sent.";

async function issueToken(user, type, subject, urlPath) {
  const raw = createRawToken();
  await repo.createActionToken({ userId: user.id, type, tokenHash: hash(raw), expiresAt: expiry() });
  const base = env.FRONTEND_URL.split(",")[0].trim();
  if (!base) throw new Error("FRONTEND_URL must be configured for account action links.");
  const link = new URL(urlPath, base);
  link.searchParams.set("token", raw);
  void mailer.sendActionEmail({
    to: user.email,
    subject,
    text: `Use this link within ${TOKEN_TTL_MINUTES} minutes. If you did not request this, ignore this email.\n\n${link.toString()}`,
  }).catch((error) => {
    logger.error("Account action email delivery failed", {
      eventType: type,
      error: error.message,
    });
  });
}

async function requestEmailVerification(email) {
  const user = await repo.findUserByEmail(email);
  if (user && user.account_status === "active" && !user.email_verified_at) {
    await issueToken(user, "email_verification", "Verify your Bengal Beyond email", "/verify-email");
  }
  return { message: publicMessage };
}

async function verifyEmail(rawToken) {
  const userId = await repo.consumeActionToken({ tokenHash: hash(rawToken), type: "email_verification" });
  if (!userId) throw AppError.badRequest("Verification link is invalid or expired.", undefined, "INVALID_ACTION_TOKEN");
  await repo.markEmailVerified(userId);
  return { emailVerified: true };
}

async function requestPasswordReset(email) {
  const user = await repo.findUserByEmail(email);
  if (user && user.account_status === "active") {
    await issueToken(user, "password_reset", "Reset your Bengal Beyond password", "/reset-password");
  }
  return { message: publicMessage };
}

async function resetPassword(rawToken, password) {
  const userId = await repo.consumeActionToken({ tokenHash: hash(rawToken), type: "password_reset" });
  if (!userId) throw AppError.badRequest("Password reset link is invalid or expired.", undefined, "INVALID_ACTION_TOKEN");
  const passwordHash = await hashPassword(password);
  await repo.updatePasswordAndRevokeSessions(userId, passwordHash);
  return { passwordReset: true, sessionsRevoked: true };
}

module.exports = { requestEmailVerification, verifyEmail, requestPasswordReset, resetPassword };
