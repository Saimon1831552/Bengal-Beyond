const { sendMail } = require("../../../services/mailer");

// Contract: async send({ to, subject, text }) -> { messageId }
async function send({ to, subject, text }) {
  return sendMail({ to, subject, text });
}
module.exports = { send };
