// Configure a real SMS provider adapter here. Contract: async send({to, text}) -> {messageId?}.
// Use E.164 phone numbers and keep provider credentials in environment variables.
async function send() {
  throw new Error("SMS provider is not configured. Implement providers/sms.provider.js first.");
}
module.exports = { send };
