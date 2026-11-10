import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { destinationJsonLd } from "@/lib/jsonld";
import { getDestination, getDestinations, getToursByDestination } from "@/services/content";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

// Pre-render every destination at build time (fast + crawlable)
export async function generateStaticParams() {
  return (await getDestinations()).map((d) => ({ slug: d.slug }));
}

// `await params` works on Next 14, 15 and 16
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) return {};
  return buildMetadata({
    title: `${d.name}, Bangladesh: Travel Guide & Tours`,
    description: d.summary,
    path: `/destinations/${d.slug}`,
    image: d.image,
  });
}

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) notFound();
  const related = await getToursByDestination(d.slug);

  return (
    <main>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }, { name: d.name, path: `/destinations/${d.slug}` }]} />
      <h1>{d.name}</h1>
      <p>{d.region}</p>
      <p>{d.summary}</p>
      {related.length > 0 && (
        <section aria-labelledby="rt">
          <h2 id="rt">Tours in {d.name}</h2>
          <ul>{related.map((t) => <li key={t.slug}><Link href={`/tours/${t.slug}`}>{t.title}</Link></li>)}</ul>
        </section>
      )}
      <JsonLd data={destinationJsonLd(d)} />
    </main>
  );
}
