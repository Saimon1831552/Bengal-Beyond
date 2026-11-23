import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Image from "@/components/ui/RemoteImage";
import { buildMetadata } from "@/lib/seo";
import { destinationJsonLd } from "@/lib/jsonld";
import { getDestination, getDestinations, getToursByDestination } from "@/services/content";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { formatPrice } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    return (await getDestinations()).map((d) => ({ slug: d.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) return {};
  return buildMetadata({
    title: `${d.name}, Bangladesh: Travel Guide & Tours`,
    description: d.summary,
    path: `/destinations/${d.slug}`,
    image: d.image,
    keywords: [d.name, d.region, "Bangladesh travel", "Bangladesh tours", ...(d.interests || [])].filter(Boolean),
  });
}

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) notFound();
  const related = await getToursByDestination(d.slug);

  return (
    <main>
      <Container className="pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Destinations", path: "/destinations" },
            { name: d.name, path: `/destinations/${d.slug}` },
          ]}
        />
      </Container>

      <Container className="py-8">
        <div className="max-w-3xl">
          {d.region && (
            <p className="text-xs font-bold uppercase tracking-widest text-accent">{d.region}</p>
          )}
          <h1 className="mt-2 font-display text-4xl text-primary md:text-5xl">{d.name}</h1>
          {d.summary && <p className="mt-4 text-lg leading-relaxed text-foreground/80">{d.summary}</p>}
        </div>

        {d.image && (
          <div className="relative mt-8 aspect-[16/9] max-h-[480px] overflow-hidden rounded-3xl">
            <Image src={d.image} alt={d.name} fill priority className="object-cover" />
          </div>
        )}

        {related.length > 0 && (
          <section aria-labelledby="rt" className="mt-12">
            <h2 id="rt" className="font-display text-2xl text-primary">
              Tours featuring {d.name}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tours/${t.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:border-accent"
                >
                  {t.image && (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={t.image}
                        alt={t.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs text-muted">{t.days} {t.days === 1 ? "day" : "days"}</p>
                    <h3 className="mt-1 font-display text-lg text-primary group-hover:text-accent">{t.title}</h3>
                    {t.price != null && (
                      <p className="mt-3 text-sm font-semibold text-primary">
                        From {formatPrice(t.price, t.currency)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>
      <JsonLd data={destinationJsonLd(d)} />
    </main>
  );
}