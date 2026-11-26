import filterXSS from "xss";

const XSS_OPTIONS = {
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed", "form"],
  safeAttrValue(tag, name, value, cssFilter) {
    const safeValue = filterXSS.safeAttrValue(tag, name, value, cssFilter);
    return /^(href|src)$/i.test(name) && /^\s*data:/i.test(safeValue)
      ? ""
      : safeValue;
  },
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sanitizeRichHtml(raw) {
  const str = String(raw || "");
  const hasHtml = /<\/?[a-z][^>]*>/i.test(str);
  const html = hasHtml
    ? str
    : str
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph) => {
          const escaped = escapeHtml(paragraph).replace(/\n/g, "<br />");
          return `<p>${escaped}</p>`;
        })
        .join("");

  return filterXSS(html, XSS_OPTIONS);
}
