import Link from "next/link";
import Container from "@/components/ui/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import TourCard from "@/components/cards/TourCard";
import TourFilters from "@/components/tours/TourFilters";
import { buildMetadata } from "@/lib/seo";
import { getDestinations, getCategories, searchTours } from "@/services/content";
import { readFilters, toApiQuery, toHref, hasFilters, DURATION_OPTIONS } from "@/lib/tourFilters";

const TITLE = "Bangladesh Tours & Experiences";
const DESC = "Guided adventure, wildlife, cultural, beach, food and photography tours across Bangladesh, led by local experts.";

export async function generateMetadata({ searchParams }) {
  const f = readFilters(await searchParams);
  const meta = buildMetadata({ title: TITLE, description: DESC, path: "/tours" }); // canonical is always /tours
  // filtered or paged views are for people, not the index
  return hasFilters(f) || f.page !== "1" ? { ...meta, robots: { index: false, follow: true } } : meta;
}

const EMPTY = { items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } };

export default async function ToursPage({ searchParams }) {
  const f = readFilters(await searchParams);
  const [destinations, categories] = await Promise.all([getDestinations().catch(() => []), getCategories()]);
  const dest = destinations.find((d) => d.slug === f.destination);

  let result = EMPTY;
  let failed = false;
  if (!(f.destination && !dest)) { // an unknown destination slug can only match nothing
    try { result = await searchTours(toApiQuery(f, dest?.id)); } catch { failed = true; }
  }
  const { items, meta } = result;

  const chips = [
    f.q && ["q", `“${f.q}”`],
    dest && ["destination", dest.name],
    f.category && ["category", categories.find((c) => String(c.id) === f.category)?.name || "Category"],
    f.duration && ["duration", DURATION_OPTIONS.find(([v]) => v === f.duration)?.[1]],
    f.minPrice && ["minPrice", `From ${f.minPrice}`],
    f.maxPrice && ["maxPrice", `Up to ${f.maxPrice}`],
    f.date && ["date", `Departs after ${f.date}`],
    f.guests && ["guests", `${f.guests} traveller${f.guests === "1" ? "" : "s"}`],
    f.available && ["available", "Open seats only"],
  ].filter(Boolean);

  return (
    <Container as="main" className="py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }]} />
      <h1 className="mt-4 text-4xl text-primary">{TITLE}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <TourFilters values={f} destinations={destinations} categories={categories} />

        <section aria-live="polite">
          <p className="text-sm text-muted">
            {failed ? "" : `${meta.total} tour${meta.total === 1 ? "" : "s"} found`}
          </p>

          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {chips.map(([key, text]) => (
                <li key={key}>
                  <Link href={toHref(f, { omit: [key] })} aria-label={`Remove filter: ${text}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20">
                    {text} <span aria-hidden="true">×</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {failed ? (
            <p role="alert" className="mt-6 rounded-2xl border border-terracotta/30 bg-terracotta/10 p-6 text-sm text-terracotta">
              We couldn&apos;t load tours right now. Please try again in a moment.
            </p>
          ) : !items.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-white p-10 text-center">
              <p className="text-lg text-primary">No tours match those filters.</p>
              <p className="mt-2 text-sm text-muted">Try a different date, a wider price range, or fewer filters.</p>
              <Link href="/tours" className="btn-gold mt-5 inline-block rounded-full px-6 py-2.5 text-sm font-semibold">Clear filters</Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((t) => <TourCard key={t.slug} tour={t} />)}
            </div>
          )}

          {meta.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 text-sm">
              {meta.page > 1
                ? <Link href={toHref(f, { page: meta.page - 1 })} className="rounded-full border border-primary px-4 py-2 text-primary">Previous</Link>
                : <span className="rounded-full border border-border px-4 py-2 text-muted">Previous</span>}
              <span>Page {meta.page} of {meta.totalPages}</span>
              {meta.page < meta.totalPages
                ? <Link href={toHref(f, { page: meta.page + 1 })} className="rounded-full border border-primary px-4 py-2 text-primary">Next</Link>
                : <span className="rounded-full border border-border px-4 py-2 text-muted">Next</span>}
            </nav>
          )}
        </section>
      </div>
    </Container>
  );
}