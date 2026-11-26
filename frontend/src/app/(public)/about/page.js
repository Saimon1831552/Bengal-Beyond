import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getDestinations, getHighlights, getSiteInfo, getTours } from "@/services/content";

export const revalidate = 60;

export const metadata = buildMetadata({
  title: `About ${siteConfig.name} — Local Journeys Across Bangladesh`,
  description:
    "Discover how Bengal Beyond crafts responsible, small-group, and private expeditions across the Sundarbans, Sylhet, Chittagong Hill Tracts, and ancient Bengal.",
  path: "/about",
});

const PILLARS = [
  {
    num: "01",
    title: "Dhaka-Born Route Craft",
    body: "Every itinerary is field-tested by our Dhaka operations team—balancing river tides, forest permit windows, and unhurried village stays.",
  },
  {
    num: "02",
    title: "Licensed Naturalists & Historians",
    body: "Travel with Forest Department-accredited Sundarbans trackers, archaeology researchers, and bilingual hill-tract hosts rather than scripted drivers.",
  },
  {
    num: "03",
    title: "Community-First Economics",
    body: "Over 70% of ground spend stays directly with family-run tea bungalows, wooden boat crews, indigenous homestays, and local cooperatives.",
  },
  {
    num: "04",
    title: "24/7 Live Ground Support",
    body: "From Hazrat Shahjalal airport pickup to remote border permits in Bandarban and Sajek, a dedicated trip coordinator monitors every leg.",
  },
];

export default async function AboutPage() {
  const [site, highlights, tours, destinations] = await Promise.all([
    getSiteInfo(),
    getHighlights(),
    getTours(),
    getDestinations(),
  ]);

  const brandName = site?.site_name || site?.siteName || siteConfig.name;
  const tagline =
    site?.about_headline ||
    "Showing the world the living soul of Bengal—beyond the brochure.";
  const storyLead =
    site?.about_description ||
    "Bangladesh is the world's largest river delta—a land of tidal mangrove forests, emerald tea valleys, terracotta temple cities, and warm hospitality that rarely appears on conventional travel maps. We built Bengal Beyond to open those doors safely and thoughtfully.";

  const avgRating = highlights?.stats?.averageRating
    ? `${Number(highlights.stats.averageRating).toFixed(1)}★`
    : "4.9★";

  const milestones = [
    {
      metric: destinations.length > 0 ? `${destinations.length}+` : "8",
      label: "Curated Regions",
      detail: "Destinations across Bangladesh",
    },
    {
      metric: tours.length > 0 ? `${tours.length}+` : "20+",
      label: "Active Expeditions",
      detail: "Holiday, short & day departures",
    },
    {
      metric: avgRating,
      label: "Guest Rating",
      detail: "Verified post-trip reviews",
    },
    {
      metric: "24/7",
      label: "Dhaka Operations",
      detail: site?.contact_phone || "Live ground & permit support",
    },
  ];

  const featuredReviews = (highlights?.reviews ?? []).slice(0, 3);

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden bg-primary-dark py-20 text-white sm:py-28">
        <Image
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80"
          alt="Misty morning hills and river valleys of Bangladesh"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#082B21] via-[#082B21]/75 to-transparent"
        />

        <Container className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Our Story · {site?.office_city || "Dhaka, Bangladesh"}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {tagline}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-sand/90 sm:text-base">
            {storyLead}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tours"
              className="btn-gold rounded-full px-6 py-3 text-xs font-semibold sm:text-sm"
            >
              Explore Curated Tours
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:text-sm"
            >
              Talk to a Dhaka Planner
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl lg:col-span-6">
            <Image
              src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80"
              alt="Wooden boat navigating calm emerald waterways in Bengal"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-primary-dark/90 px-5 py-3.5 text-white backdrop-blur-md sm:right-auto">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Field-Tested Expeditions
              </p>
              <p className="mt-0.5 text-xs text-sand/90">
                {destinations.length > 0
                  ? destinations
                      .slice(0, 5)
                      .map((d) => d.name)
                      .join(" · ")
                  : "Sundarbans · Srimangal · Sajek · Paharpur · Cox's Bazar"}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Why {brandName}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-primary sm:text-4xl">
              Built for curious travellers, designed by locals who know every bend of the river.
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
              <p>
                For years, visitors arriving in Dhaka faced two extremes: rigid coach packages
                that rushed past living heritage, or fragmented logistics where forest permits,
                ferry schedules, and hill-tract clearances turned into guesswork.
              </p>
              <p>
                {brandName} bridges that gap—combining modern digital booking, transparent
                departures, and vetted safety standards with deep local friendships across all
                eight divisions of Bangladesh.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-7 sm:grid-cols-4">
              {milestones.map((m) => (
                <div key={m.label}>
                  <p className="font-display text-2xl font-bold text-primary sm:text-3xl">
                    {m.metric}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-foreground">{m.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-white py-16 sm:py-24">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              How We Operate
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-primary sm:text-4xl">
              Four commitments behind every departure
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <article
                key={p.num}
                className="flex flex-col justify-between rounded-3xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div>
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {p.num}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.body}</p>
                </div>
              </article>
            ))}
          </div>

          {featuredReviews.length > 0 && (
            <div className="mt-14 border-t border-border pt-12">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Verified Guest Voices
              </p>
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {featuredReviews.map((rev, i) => (
                  <blockquote
                    key={rev.id || i}
                    className="rounded-3xl border border-border bg-background p-6"
                  >
                    <p className="text-xs font-semibold text-gold">
                      {"★".repeat(Math.max(1, Math.min(5, Number(rev.rating) || 5)))}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      &ldquo;{rev.comment || rev.review_text}&rdquo;
                    </p>
                    <footer className="mt-4 text-xs font-semibold text-primary">
                      — {rev.reviewer_name || rev.full_name || "Verified Traveller"}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="rounded-3xl bg-primary-dark px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-gold">
              Ready When You Are
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-2xl font-semibold sm:text-4xl">
              Let our Dhaka team tailor your dates, pace, and interests.
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/tours" className="btn-gold rounded-full px-7 py-3 text-xs font-semibold sm:text-sm">
                Browse All Tours
              </Link>
              <Link
                href="/blog"
                className="rounded-full border border-white/25 px-7 py-3 text-xs font-semibold text-white transition hover:bg-white/10 sm:text-sm"
              >
                Read Field Journal
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}