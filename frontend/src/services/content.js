/**
 * Content access layer: fetches from the Express API and maps rows to the
 * shape the pages already use. Same exports as the old static version.
 */

const API = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const REVALIDATE = 3600;
const TOUR_REVALIDATE = 300;

async function api(path, revalidate = REVALIDATE) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
    // Missing or malformed slug -> treat as "not found" so pages call notFound()
    if ([400, 404, 422].includes(res.status)) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}


async function apiRaw(path, revalidate = 60) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json();
}

export async function getSiteInfo() {
  try { return (await apiRaw("/site-info", 60)).data; } catch { return null; }
}

export async function getHighlights() {
  try { return (await apiRaw("/highlights", 300)).data; }
  catch { return { reviews: [], stats: null }; }
}

export async function getGallery(limit = 9) {
  try {
    const j = await apiRaw(`/gallery?limit=${limit}`, 300);
    return (j.data?.items ?? []).map((g) => ({ id: g.id, src: g.media_url, caption: g.title || g.alt_text || "", alt: g.alt_text || g.title || "" }));
  } catch { return []; }
}

const NO_REVIEWS = { items: [], summary: { total: 0, averageRating: 0 } };
export async function getTourReviews(tourId) {
  try {
    const j = await apiRaw(`/tours/${tourId}/reviews?limit=20`, 300);
    return { items: j.data ?? [], summary: j.meta?.summary ?? NO_REVIEWS.summary };
  } catch { return NO_REVIEWS; }
}

export async function getTourDepartures(tourId) {
  try {
    const j = await apiRaw(`/tours/${tourId}/departures?availableOnly=true`, 120);
    const now = Date.now();
    return (j.data ?? []).filter((d) => d.status === "scheduled" && new Date(d.starts_at).getTime() > now).slice(0, 6);
  } catch { return []; }
}

/* ---------- mappers: API row -> page shape ---------- */

function mapDestination(r) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    region: r.region || r.country,
    summary: r.description || r.meta_description || "",
    image: r.featured_image_url || undefined,
    tourCount: r.published_tour_count,
    // not provided by the API yet (JSON-LD skips them when undefined)
    lat: undefined,
    lng: undefined,
    interests: [],
    updatedAt: undefined,
  };
}

function mapTour(r, destinationSlugs = []) {
  const categories = r.categories ? String(r.categories).split(", ") : [];
  const tags = r.tags ? String(r.tags).split(", ") : [];
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: categories[0] || r.destination,
    categories,
    tags,
    destination: r.destination,
    days: r.duration_days,
    destinations: destinationSlugs,
    summary: r.summary || "",
    description: r.description || null,
    cancellationPolicy: r.cancellation_policy || "",
    image: r.cover_image_url || undefined,
    price: r.base_price != null ? Number(r.base_price) : undefined,
    currency: r.currency_code,
    updatedAt: r.updated_at,
  };
}

function mapSearchTour(r) {
  const base = mapTour(r);
  const cats = r.categories ? String(r.categories).split(", ") : [];
  const override = r.lowest_departure_price != null ? Number(r.lowest_departure_price) : null;
  return {
    ...base,
    category: cats[0] || r.destination,
    nextDeparture: r.next_departure || null,
    price: override != null && base.price != null ? Math.min(base.price, override) : base.price,
  };
}

function mapPost(r) {
  const published = r.published_at ? String(r.published_at).slice(0, 10) : undefined;
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt || "",
    author: "Bengal Beyond Editorial", // API has no author name yet
    publishedAt: published,
    updatedAt: published,
    body: r.content || r.body || "",
    image: r.featured_image_url || undefined,
  };
}

/* ---------- destinations ---------- */

export async function getDestinations() {
  const data = await api("/destinations?limit=100");
  return (data?.items ?? []).map(mapDestination);
}

export async function getDestination(slug) {
  const r = await api(`/destinations/${encodeURIComponent(slug)}`);
  return r ? mapDestination(r) : null;
}

export async function getToursByDestination(slug) {
  const data = await api(`/destinations/${encodeURIComponent(slug)}/tours?limit=100`, TOUR_REVALIDATE);
  return (data?.items ?? []).map((r) => mapTour(r, [slug]));
}

/* ---------- tours ---------- */

export async function getTours() {
  const data = await api("/tours?limit=100", TOUR_REVALIDATE);
  return (data ?? []).map((r) => mapTour(r));
}

export async function searchTours(query) {
  const json = await apiRaw(`/tours/search?${query}`);
  return {
    items: (json.data ?? []).map(mapSearchTour),
    meta: json.meta ?? { page: 1, limit: 12, total: 0, totalPages: 1 },
  };
}

export async function getCategories() {
  const json = await apiRaw("/categories", 3600);
  return json.data ?? [];
}

export async function getTour(slug) {
  const r = await api(`/tours/${encodeURIComponent(slug)}`, TOUR_REVALIDATE);
  if (!r) return null;
  return mapTour(r, r.destination_slug ? [r.destination_slug] : []);
}

/* ---------- blog ---------- */

export async function getPosts() {
  const data = await api("/blog?limit=100");
  return (data?.items ?? []).map(mapPost);
}

export async function getPost(slug) {
  const r = await api(`/blog/${encodeURIComponent(slug)}`);
  return r ? mapPost(r) : null;
}