import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getTours } from "@/services/content";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import Container from "@/components/ui/Container";
import TourCard from "@/components/cards/TourCard";

export const metadata = buildMetadata({
  title: "Bangladesh Tours & Experiences",
  description: "Guided adventure, wildlife, cultural, beach, food and photography tours across Bangladesh, led by local experts.",
  path: "/tours",
});

export default async function ToursPage() {
  const tours = await getTours();
  return (
       <Container as="main" className="py-10">
         <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }]} />
         <h1 className="mt-4 text-4xl">Bangladesh Tours &amp; Experiences</h1>
         <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {tours.map((t) => <TourCard key={t.slug} tour={t} />)}
         </div>
       </Container>
      );
}
