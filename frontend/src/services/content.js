/**
 * Content access layer: fetches from the Express API and maps rows to the
 * shape the pages already use. Same exports as the old static version.
 */

const API = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const REVALIDATE = 3600;

async function api(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE },
  });
  // Missing or malformed slug -> treat as "not found" so pages call notFound()
  if ([400, 404, 422].includes(res.status)) return null;
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  const json = await res.json();
  return json.data;
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
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.destination, // no category on the tour row; show destination for now
    days: r.duration_days,
    destinations: destinationSlugs,
    summary: r.summary || "",
    description: r.description || null,
    image: r.cover_image_url || undefined,
    price: r.base_price != null ? Number(r.base_price) : undefined,
    currency: r.currency_code,
    updatedAt: r.updated_at,
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
  const data = await api(`/destinations/${encodeURIComponent(slug)}/tours?limit=100`);
  return (data?.items ?? []).map((r) => mapTour(r, [slug]));
}

/* ---------- tours ---------- */

export async function getTours() {
  const data = await api("/tours?limit=100");
  return (data ?? []).map((r) => mapTour(r));
}

export async function getTour(slug) {
  const r = await api(`/tours/${encodeURIComponent(slug)}`);
  if (!r) return null;
  // Tour detail only has the destination NAME, so match it to a destination slug
  const destinations = await getDestinations();
  const match = destinations.find((d) => d.name.trim().toLowerCase() === String(r.destination).trim().toLowerCase());
  return mapTour(r, match ? [match.slug] : []);
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