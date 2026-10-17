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
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return transporter;
}

async function sendActionEmail({ to, subject, text }) {
  if (!env.MAIL_FROM) throw new Error("MAIL_FROM must be configured for account emails.");
  await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, text });
}

module.exports = { sendActionEmail };
