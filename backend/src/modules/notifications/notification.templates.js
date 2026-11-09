function render(template, payload) {
  return String(template).replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const value = payload && Object.prototype.hasOwnProperty.call(payload, key) ? payload[key] : "";
    return value == null ? "" : String(value);
  });
}
function renderTemplate(row, payload) {
  return {
    subject: row.subject_template ? render(row.subject_template, payload) : undefined,
    body: render(row.body_template, payload)
  };
}
module.exports = { render, renderTemplate };
