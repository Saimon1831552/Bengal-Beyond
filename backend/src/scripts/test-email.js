const { verifyConnection, sendMail } = require("../services/mailer");
const env = require("../config/env");

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npm run email:test -- you@example.com");
    process.exitCode = 1;
    return;
  }
  try {
    console.log(`Connecting to ${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER}...`);
    await verifyConnection();
    console.log("SMTP connection and credentials OK.");
    const { messageId } = await sendMail({
      to,
      subject: "Bengal Beyond: test email",
      text: "This is a test email from the Bengal Beyond backend.",
    });
    console.log(`Message sent: ${messageId}`);
    console.log("Check delivery at https://mailtrap.io/sending/email_logs");
  } catch (error) {
    console.error("Email test failed:", error.message);
    process.exitCode = 1;
  }
}
main();
