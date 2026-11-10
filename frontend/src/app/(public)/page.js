import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getDestinations, getTours } from "@/services/content";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import TourCard from "@/components/cards/TourCard";
import DestinationCard from "@/components/cards/DestinationCard";

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
    <section className="bg-gradient-to-br from-primary-dark via-primary to-accent py-20 text-white">
      <Container>
        <h1 className="max-w-2xl text-5xl !text-white">Discover Bangladesh. Beyond the Ordinary.</h1>
        <p className="mt-5 max-w-xl text-lg text-sand">{siteConfig.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/tours" variant="gold">Explore tours</Button>
          <Button href="/destinations" variant="outline" className="!border-white !text-white hover:!bg-white hover:!text-primary">
            View destinations
          </Button>
        </div>
      </Container>
    </section>

    <Container as="section" className="py-14" aria-labelledby="dest">
      <h2 id="dest" className="text-3xl">Featured destinations</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.slice(0, 4).map((d) => <DestinationCard key={d.slug} destination={d} />)}
      </div>
    </Container>

    <Container as="section" className="pb-14" aria-labelledby="tours">
      <h2 id="tours" className="text-3xl">Tours &amp; experiences</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.slice(0, 3).map((t) => <TourCard key={t.slug} tour={t} />)}
      </div>
    </Container>
  </main>
);
}
