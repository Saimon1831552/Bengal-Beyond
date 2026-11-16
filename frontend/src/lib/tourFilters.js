export const SORTS = [
  ["recommended", "Recommended"],
  ["departure_soon", "Departing soonest"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["duration_asc", "Duration: shortest"],
  ["duration_desc", "Duration: longest"],
  ["newest", "Newest"],
];

export const DURATION_OPTIONS = [
  ["day", "Day trips (1 day)"],
  ["short", "Short (2–3 days)"],
  ["holiday", "Holiday (4+ days)"],
];
const DURATIONS = { day: { max: 1 }, short: { min: 2, max: 3 }, holiday: { min: 4 } };

const first = (v) => (Array.isArray(v) ? v[0] : v);

/** Reads untrusted URL params and keeps only valid values, so we never send the API a request it would 400. */
export function readFilters(sp = {}) {
  const s = (k) => String(first(sp[k]) ?? "").trim();
  const int = (k, max) => (/^\d{1,9}$/.test(s(k)) && +s(k) >= 1 && +s(k) <= max ? String(+s(k)) : "");
  const money = (k) => (/^\d{1,9}(\.\d{1,2})?$/.test(s(k)) ? s(k) : "");
  const date = (k) => (/^\d{4}-\d{2}-\d{2}$/.test(s(k)) && !Number.isNaN(Date.parse(s(k))) ? s(k) : "");
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s("destination")) ? s("destination") : "";
  return {
    q: s("q").slice(0, 120),
    destination: slug,
    category: int("category", 1e9),
    minPrice: money("minPrice"),
    maxPrice: money("maxPrice"),
    duration: DURATIONS[s("duration")] ? s("duration") : "",
    date: date("date"),
    guests: int("guests", 100),
    available: s("available") === "1" ? "1" : "",
    sort: SORTS.some(([v]) => v === s("sort")) ? s("sort") : "recommended",
    page: int("page", 100000) || "1",
  };
}

const FILTER_KEYS = ["q", "destination", "category", "minPrice", "maxPrice", "duration", "date", "guests", "available"];

/** The user-facing query (no page, default sort omitted), optionally leaving some keys out */
export function filtersToQuery(f, omit = []) {
  const p = new URLSearchParams();
  for (const k of FILTER_KEYS) if (f[k] && !omit.includes(k)) p.set(k, f[k]);
  if (f.sort !== "recommended" && !omit.includes("sort")) p.set("sort", f.sort);
  return p;
}

export const hasFilters = (f) => filtersToQuery(f).toString() !== "";

export function toHref(f, { omit = [], page = 1 } = {}) {
  const p = filtersToQuery(f, omit);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/tours?${s}` : "/tours";
}

/** Translate to the backend's /tours/search query string */
export function toApiQuery(f, destinationId) {
  const p = new URLSearchParams({ limit: "12", page: f.page });
  if (f.q) p.set("q", f.q);
  if (destinationId) p.set("destinationId", String(destinationId));
  if (f.category) p.set("categoryId", f.category);
  let [lo, hi] = [f.minPrice, f.maxPrice];
  if (lo && hi && Number(lo) > Number(hi)) [lo, hi] = [hi, lo]; // the API rejects min > max
  if (lo) p.set("minPrice", lo);
  if (hi) p.set("maxPrice", hi);
  const d = DURATIONS[f.duration];
  if (d?.min) p.set("minDuration", String(d.min));
  if (d?.max) p.set("maxDuration", String(d.max));
  if (f.date) p.set("departureFrom", f.date);
  if (f.guests) p.set("minSeats", f.guests);
  if (f.available) p.set("availableOnly", "true");
  if (f.sort !== "recommended") p.set("sort", f.sort);
  return p.toString();
}