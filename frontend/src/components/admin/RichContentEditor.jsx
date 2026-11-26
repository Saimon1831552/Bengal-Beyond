"use client";
import { useRef, useState } from "react";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

export { sanitizeRichHtml };

const ACTIONS = [
  { label: "P", title: "Paragraph", paragraph: true },
  { label: "B", title: "Bold", before: "<strong>", after: "</strong>", cls: "font-bold" },
  { label: "I", title: "Italic", before: "<em>", after: "</em>", cls: "italic" },
  { label: "Highlight", title: "Highlight text", before: "<mark>", after: "</mark>", cls: "bg-gold/30 text-primary-dark" },
  { label: "H2", title: "Section heading", before: "\n<h2>", after: "</h2>\n", cls: "font-semibold" },
  { label: "H3", title: "Subheading", before: "\n<h3>", after: "</h3>\n", cls: "font-semibold" },
  { label: "• List", title: "Bullet list", list: "ul" },
  { label: "1. List", title: "Numbered list", list: "ol" },
  { label: "Quote", title: "Blockquote callout", before: "\n<blockquote>", after: "</blockquote>\n" },
  { label: "Link", title: "Insert link", link: true },
];

function escapeAttr(val) {
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function RichContentEditor({
  id,
  name,
  required,
  disabled,
  value = "",
  onChange,
  rows = 12,
  placeholder = "Write your article content… Select any text and use the toolbar to format.",
}) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(false);

  const applyFormat = (action) => {
    const el = ref.current;
    if (!el || disabled) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);

    let replacement = "";
    if (action.paragraph) {
      const lines = (selected || "Write your paragraph here.")
        .split(/\r?\n+/)
        .map((l) => l.trim())
        .filter(Boolean);
      replacement = `\n${lines.map((l) => `<p>${l}</p>`).join("\n")}\n`;
    } else if (action.list) {
      const tag = action.list;
      const lines = (selected || "First point\nSecond point")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      replacement = `\n<${tag}>\n${lines.map((l) => `  <li>${l}</li>`).join("\n")}\n</${tag}>\n`;
    } else if (action.link) {
      const rawUrl = window.prompt(
        "Enter URL (e.g. /tours/sundarbans-wildlife-adventure or https://...):",
        "/tours/"
      );
      if (!rawUrl) return;
      const trimmed = rawUrl.trim();
      if (/^(javascript|data|vbscript):/i.test(trimmed)) return;
      const safeUrl = escapeAttr(trimmed);
      const isExternal = /^https?:\/\//i.test(trimmed);
      const attrs = isExternal
        ? `href="${safeUrl}" target="_blank" rel="noopener noreferrer"`
        : `href="${safeUrl}"`;
      replacement = `<a ${attrs}>${selected || "Explore tour"}</a>`;
    } else {
      replacement = `${action.before}${selected || "text"}${action.after}`;
    }

    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/80 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {ACTIONS.map((a) => (
            <button
              key={a.title}
              type="button"
              disabled={preview || disabled}
              title={a.title}
              onClick={() => applyFormat(a)}
              className={`rounded-lg border border-border bg-white px-2.5 py-1 text-xs text-primary transition hover:border-primary disabled:opacity-40 ${a.cls || ""}`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview && (
        <div
          className="blog-prose min-h-[16rem] p-4 text-sm text-foreground"
          dangerouslySetInnerHTML={{
            __html: value.trim()
              ? sanitizeRichHtml(value)
              : "<p class='text-muted'>Nothing to preview yet.</p>",
          }}
        />
      )}

      {/* Keep textarea mounted so HTML5 required validation still works in Preview mode */}
      <textarea
        ref={ref}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full resize-y p-4 font-mono text-xs leading-relaxed text-foreground outline-none disabled:bg-background disabled:text-muted sm:text-sm ${
          preview ? "hidden" : "block"
        }`}
      />
    </div>
  );
}