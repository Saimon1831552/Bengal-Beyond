// Configure a real provider adapter here. Contract: async send({to, subject, text}) -> {messageId?}.
// Example integration can use Nodemailer, SES, SendGrid, etc. Do not hard-code credentials.
async function send() {
  throw new Error("Email provider is not configured. Implement providers/email.provider.js first.");
}
module.exports = { send };
