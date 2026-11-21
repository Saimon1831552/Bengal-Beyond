const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error("Email delivery is not configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD).");
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // 465 = implicit TLS
    requireTLS: env.SMTP_PORT !== 465 && env.SMTP_REQUIRE_TLS, // 587 = STARTTLS, never plaintext
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  return transporter;
}

async function sendActionEmail({ to, subject, text }) {
  if (!env.MAIL_FROM) throw new Error("MAIL_FROM must be configured for account emails.");
  await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, text });
}

async function sendMail({ to, subject, text }) {
  if (!env.MAIL_FROM) throw new Error("MAIL_FROM must be configured.");
  const info = await getTransporter().sendMail({
    from: env.MAIL_FROM,
    to,
    subject: String(subject || "").replace(/[\r\n]+/g, " ").slice(0, 200),
    text,
  });
  return { messageId: info.messageId };
}

// Checks host, port, TLS and credentials without sending anything.
async function verifyConnection() {
  await getTransporter().verify();
  return true;
}

module.exports = { sendActionEmail, sendMail, verifyConnection };
