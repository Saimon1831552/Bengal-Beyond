const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("Email delivery is not configured (SMTP_HOST/PORT/USER/PASSWORD).");
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

async function sendActionEmail({ to, subject, text }) {
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("MAIL_FROM must be configured for account emails.");
  await getTransporter().sendMail({ from, to, subject, text });
}

module.exports = { sendActionEmail };
