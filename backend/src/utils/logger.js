const env = require("../config/env");

// One JSON object per line: easy to read in a terminal, easy to ship to a log service.
function write(level, message, fields = {}) {
  if (env.NODE_ENV === "test") return;

  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...fields,
  });

  (level === "error" ? console.error : console.log)(line);
}

module.exports = {
  info: (message, fields) => write("info", message, fields),
  warn: (message, fields) => write("warn", message, fields),
  error: (message, fields) => write("error", message, fields),
};