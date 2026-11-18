export function formatPrice(amount, currency = "USD") {
  if (amount == null) return null;
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export const formatDate = (v) =>
  v ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(v)) : "";

export const titleCase = (s) =>
  String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const money = (amount, currency) => formatPrice(Number(amount), currency);

export const formatDateTime = (v) =>
  v ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "";

const p2 = (n) => String(n).padStart(2, "0");

export const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export const slugify = (s) =>
  String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140);

// local <input type="datetime-local"> value -> "YYYY-MM-DD HH:MM:SS" in UTC (what MariaDB DATETIME expects)
export const toSqlUtc = (v) => (v ? new Date(v).toISOString().slice(0, 19).replace("T", " ") : null);