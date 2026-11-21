const { test } = require("node:test");
const assert = require("node:assert/strict");
const nodemailer = require("nodemailer");
const env = require("../../src/config/env");
const { sendMail, verifyConnection } = require("../../src/services/mailer");

test("sendMail requires a sender and returns message ID with a safe subject", async (t) => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalEnv = {
    MAIL_FROM: env.MAIL_FROM,
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASSWORD: env.SMTP_PASSWORD,
    SMTP_REQUIRE_TLS: env.SMTP_REQUIRE_TLS,
  };
  t.after(() => {
    nodemailer.createTransport = originalCreateTransport;
    Object.assign(env, originalEnv);
  });

  env.MAIL_FROM = "";
  await assert.rejects(sendMail({ to: "customer@example.test", subject: "Hello", text: "Body" }), /MAIL_FROM must be configured/);

  env.MAIL_FROM = "support@example.test";
  env.SMTP_HOST = "smtp.example.test";
  env.SMTP_PORT = 587;
  env.SMTP_USER = "test-user";
  env.SMTP_PASSWORD = "test-password";
  env.SMTP_REQUIRE_TLS = true;
  let message;
  let transportOptions;
  let verified = false;
  nodemailer.createTransport = (options) => {
    transportOptions = options;
    return {
      sendMail: async (outgoing) => {
        message = outgoing;
        return { messageId: "test-message-id" };
      },
      verify: async () => { verified = true; },
    };
  };

  const result = await sendMail({
    to: "customer@example.test",
    subject: "Hello\r\nBcc: attacker@example.test",
    text: "Body",
  });

  assert.equal(transportOptions.secure, false);
  assert.equal(transportOptions.requireTLS, true);
  assert.equal(transportOptions.connectionTimeout, 10000);
  assert.equal(transportOptions.greetingTimeout, 10000);
  assert.equal(transportOptions.socketTimeout, 20000);
  assert.deepEqual(message, {
    from: "support@example.test",
    to: "customer@example.test",
    subject: "Hello Bcc: attacker@example.test",
    text: "Body",
  });
  assert.deepEqual(result, { messageId: "test-message-id" });
  assert.equal(await verifyConnection(), true);
  assert.equal(verified, true);
});
