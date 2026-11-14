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