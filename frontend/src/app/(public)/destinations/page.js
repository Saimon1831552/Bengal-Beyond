import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getDestinations } from "@/services/content";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata = buildMetadata({
  title: "Destinations in Bangladesh",
  description: "Explore Cox's Bazar, the Sundarbans, Sylhet, Sajek Valley, Bandarban, Saint Martin's Island, Rangamati and Srimangal.",
  path: "/destinations",
});

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  return (
    <main>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }]} />
      <h1>Destinations in Bangladesh</h1>
      <ul>
        {destinations.map((d) => (
          <li key={d.slug}><h2><Link href={`/destinations/${d.slug}`}>{d.name}</Link></h2><p>{d.summary}</p></li>
        ))}
      </ul>
    </main>
  );
}
