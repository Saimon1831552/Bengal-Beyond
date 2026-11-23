
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4", "blockquote",
  "ul", "ol", "li", "a", "hr", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td", "img",
]);

const DANGEROUS_BLOCK_RE = /<\s*(script|style|iframe|object|embed|form|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const SELF_CLOSING_DANGEROUS_RE = /<\s*(script|style|iframe|object|embed|form|meta|link|base)[^>]*\/?>/gi;
const TAG_RE = /<\/?([a-zA-Z0-9-]+)([^>]*)>/g;

function sanitizeAttrs(tagName, rawAttrs) {
  if (!rawAttrs) return "";
  const kept = [];
  const attrRe = /([a-zA-Z0-9-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;

  while ((match = attrRe.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase();
    const val = (match[2] ?? match[3] ?? match[4] ?? "").trim();

    if (name.startsWith("on") || name === "style") continue;

    if (name === "class") {
      kept.push(`class="${val.replace(/"/g, "&quot;")}"`);
    } else if (tagName === "a" && (name === "href" || name === "target")) {
      if (name === "href" && !/^(https?:|mailto:|\/|#)/i.test(val)) continue;
      kept.push(`${name}="${val.replace(/"/g, "&quot;")}"`);
    } else if (tagName === "img" && ["src", "alt", "width", "height"].includes(name)) {
      if (name === "src" && !/^(https?:|\/)/i.test(val)) continue;
      kept.push(`${name}="${val.replace(/"/g, "&quot;")}"`);
    }
  }

  if (tagName === "a") {
    kept.push('rel="noopener noreferrer"');
  }

  return kept.length ? ` ${kept.join(" ")}` : "";
}

function cleanHtml(dirty) {
  if (dirty == null) return "";
  let html = String(dirty)
    .replace(DANGEROUS_BLOCK_RE, "")
    .replace(SELF_CLOSING_DANGEROUS_RE, "");

  html = html.replace(TAG_RE, (full, rawTag, rawAttrs) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (full.startsWith("</")) return `</${tag}>`;
    const isVoid = tag === "br" || tag === "hr" || tag === "img";
    const attrs = sanitizeAttrs(tag, rawAttrs);
    return isVoid ? `<${tag}${attrs} />` : `<${tag}${attrs}>`;
  });

  return html.trim();
}

module.exports = { cleanHtml };