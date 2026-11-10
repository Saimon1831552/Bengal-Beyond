import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getDestinations, getTours } from "@/services/content";

export const metadata = buildMetadata({
  title: { absolute: `${siteConfig.name} | Bangladesh Tours & Travel Experiences` },
  description: siteConfig.description,
  path: "/",
});

export const revalidate = 3600;

export default async function HomePage() {
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
  return (
    <main>
      {/* Exactly one h1 per page, containing the primary keyword */}
      <h1>Discover Bangladesh. Beyond the Ordinary.</h1>
      <p>{siteConfig.description}</p>

      <section aria-labelledby="dest">
        <h2 id="dest">Featured destinations</h2>
        <ul>{destinations.map((d) => <li key={d.slug}><Link href={`/destinations/${d.slug}`}>{d.name}</Link></li>)}</ul>
      </section>

      <section aria-labelledby="tours">
        <h2 id="tours">Tours &amp; experiences</h2>
        <ul>{tours.map((t) => <li key={t.slug}><Link href={`/tours/${t.slug}`}>{t.title}</Link></li>)}</ul>
      </section>
    </main>
  );
}
