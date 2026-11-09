const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+[1-9]\d{7,14}$/; // E.164 format
const KEY = /^[a-z][a-z0-9_]{1,99}$/;
function validateChannel(channel) {
  if (!["email", "sms"].includes(channel)) throw Object.assign(new Error("channel must be email or sms"), { statusCode: 400 });
  return channel;
}
function validateRecipient(channel, recipient) {
  if (typeof recipient !== "string" || recipient.length > 190) throw Object.assign(new Error("Invalid recipient"), { statusCode: 400 });
  const value = recipient.trim();
  if (channel === "email" && !EMAIL.test(value)) throw Object.assign(new Error("A valid email recipient is required"), { statusCode: 400 });
  if (channel === "sms" && !PHONE.test(value)) throw Object.assign(new Error("SMS recipient must be in E.164 format, e.g. +8801XXXXXXXXX"), { statusCode: 400 });
  return value;
}
function validateKey(key) {
  if (typeof key !== "string" || !KEY.test(key)) throw Object.assign(new Error("Invalid notification template key"), { statusCode: 400 });
  return key;
}
module.exports = { validateChannel, validateRecipient, validateKey };
