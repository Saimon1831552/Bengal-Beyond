export function formatPrice(amount, currency = "USD") {
  if (amount == null) return null;
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}