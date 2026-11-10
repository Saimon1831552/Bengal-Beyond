import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getDestinations } from "@/services/content";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import Container from "@/components/ui/Container";
import DestinationCard from "@/components/cards/DestinationCard";

export const metadata = buildMetadata({
  title: "Destinations in Bangladesh",
  description: "Explore Cox's Bazar, the Sundarbans, Sylhet, Sajek Valley, Bandarban, Saint Martin's Island, Rangamati and Srimangal.",
  path: "/destinations",
});

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  return (
  <Container as="main" className="py-10">
    <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }]} />
    <h1 className="mt-4 text-4xl">Destinations in Bangladesh</h1>
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {destinations.map((d) => <DestinationCard key={d.slug} destination={d} />)}
    </div>
  </Container>
);
}
