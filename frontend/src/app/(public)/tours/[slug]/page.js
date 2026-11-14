import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { tourJsonLd } from "@/lib/jsonld";
import { getTour, getTours } from "@/services/content";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export async function generateStaticParams() {
  return (await getTours()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = await getTour(slug);
  if (!t) return {};
  return buildMetadata({ title: `${t.title} (${t.days} days)`, description: t.summary, path: `/tours/${t.slug}`, image: t.image });
}

export default async function TourPage({ params }) {
  const { slug } = await params;
  const t = await getTour(slug);
  if (!t) notFound();

  return (
    <main>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }, { name: t.title, path: `/tours/${t.slug}` }]} />
      <h1>{t.title}</h1>
      <p>{t.days} days · {t.category}</p>
      <p>{t.summary}</p>
      {t.destinations.length > 0 && (
        <p>Destinations: {t.destinations.map((s) => <Link className="link-underline" key={s} href={`/destinations/${s}`}>{s.replace(/-/g, " ")} </Link>)}</p>
      )}
      <Link href={`/booking?tour=${t.slug}`} className="btn-gold mt-6 inline-block rounded-full px-8 py-3 font-semibold">
        Book this tour
      </Link>
      <JsonLd data={tourJsonLd(t)} />
    </main>
  );
}
