import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Image from "@/components/ui/RemoteImage";
import Stars from "@/components/ui/Stars";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import WishlistButton from "@/components/tours/WishlistButton";
import { buildMetadata } from "@/lib/seo";
import { tourJsonLd } from "@/lib/jsonld";
import { formatDate, formatPrice } from "@/lib/format";
import { getTour, getTours, getTourReviews, getTourDepartures } from "@/services/content";

export const revalidate = 300;

export async function generateStaticParams() {
  try { return (await getTours()).map((t) => ({ slug: t.slug })); } catch { return []; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = await getTour(slug);
  if (!t) return {};
  return buildMetadata({ title: `${t.title} (${t.days} ${t.days === 1 ? "day" : "days"})`, description: t.summary, path: `/tours/${t.slug}`, image: t.image });
}

export default async function TourPage({ params }) {
  const { slug } = await params;
  const t = await getTour(slug);
  if (!t) notFound();
  const [reviews, deps] = await Promise.all([getTourReviews(t.id), getTourDepartures(t.id)]);
  const { total, averageRating } = reviews.summary;
  const jsonLd = tourJsonLd({ ...t, rating: total ? { value: averageRating, count: total } : null });
  const paragraphs = (t.description || "").split(/\n{2,}/).filter(Boolean);

  return (
    <main>
      <Container className="pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }, { name: t.title, path: `/tours/${t.slug}` }]} />
      </Container>

      <Container className="grid gap-10 py-6 lg:grid-cols-[1fr_340px]">
        <div>
          {t.image && <div className="relative aspect-[16/9] overflow-hidden rounded-3xl"><Image src={t.image} alt={t.title} fill priority className="object-cover" /></div>}
          <h1 className="mt-6 text-4xl text-primary md:text-5xl">{t.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>{t.days} {t.days === 1 ? "day" : "days"}</span>
            {t.destination && <span>{t.destination}</span>}
            {t.categories.map((category) => <span key={category}>{category}</span>)}
            {t.tags.map((tag) => <span key={tag}>#{tag}</span>)}
            {total > 0 && <a href="#reviews" className="flex items-center gap-2 text-primary"><Stars value={averageRating} /> {averageRating} ({total})</a>}
          </p>
          {t.summary && <p className="mt-5 text-lg text-foreground/80">{t.summary}</p>}
          <div className="mt-6 space-y-4 text-muted">{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
          {t.cancellationPolicy && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-primary">Cancellation policy</h2>
              <div className="mt-3 space-y-3 whitespace-pre-line text-muted">
                {t.cancellationPolicy.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          )}
          {t.destinations.length > 0 && (
            <p className="mt-6 text-sm">Destinations: {t.destinations.map((s) => <Link key={s} href={`/destinations/${s}`} className="mr-2 font-semibold text-accent underline">{s.replace(/-/g, " ")}</Link>)}</p>
          )}
        </div>

        <aside className="h-fit space-y-5 rounded-3xl border border-border bg-white p-6 lg:sticky lg:top-24">
          {t.price != null && <p><span className="text-sm text-muted">From</span><br /><span className="font-display text-3xl font-semibold text-primary">{formatPrice(t.price, t.currency)}</span> <span className="text-sm text-muted">per person</span></p>}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Upcoming departures</h2>
            {deps.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {deps.map((d) => <li key={d.id} className="flex justify-between"><span>{formatDate(d.starts_at)}</span><span className="text-muted">{d.seats_available} seats</span></li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">No departures scheduled yet. <Link href="/contact" className="font-semibold text-primary underline">Ask us</Link>.</p>}
          </div>
          {deps.length > 0
            ? <Link href={`/booking?tour=${t.slug}`} rel="nofollow" className="btn-gold block rounded-full px-6 py-3 text-center font-semibold">Book this tour</Link>
            : <Link href="/contact" className="btn-gold block rounded-full px-6 py-3 text-center font-semibold">Enquire about dates</Link>}
          <WishlistButton tourId={t.id} slug={t.slug} />
        </aside>
      </Container>

      <Container as="section" className="max-w-3xl py-10">
        <h2 id="reviews" className="scroll-mt-24 text-3xl text-primary">Traveller reviews</h2>
        {total === 0 ? (
          <p className="mt-3 text-muted">No reviews yet. Reviews come from travellers who completed this tour.</p>
        ) : (
          <>
            <p className="mt-3 flex items-center gap-3"><Stars value={averageRating} className="text-xl" /><span className="font-semibold text-primary">{averageRating} / 5</span><span className="text-sm text-muted">from {total} review{total === 1 ? "" : "s"}</span></p>
            <ul className="mt-6 space-y-5">
              {reviews.items.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex items-center justify-between"><p className="font-semibold text-primary">{r.reviewerName.split(" ")[0]}</p><Stars value={r.rating} /></div>
                  {r.reviewText && <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">{r.reviewText}</p>}
                  {r.adminReply && <p className="mt-3 rounded-xl bg-accent/10 p-3 text-sm"><strong>Reply from Bengal Beyond:</strong> {r.adminReply}</p>}
                  <p className="mt-2 text-xs text-muted">{formatDate(r.createdAt)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
      <JsonLd data={jsonLd} />
    </main>
  );
}