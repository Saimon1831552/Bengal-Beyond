import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getTours } from "@/services/content";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata = buildMetadata({
  title: "Bangladesh Tours & Experiences",
  description: "Guided adventure, wildlife, cultural, beach, food and photography tours across Bangladesh, led by local experts.",
  path: "/tours",
});

export default async function ToursPage() {
  const tours = await getTours();
  return (
    <main>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }]} />
      <h1>Bangladesh Tours &amp; Experiences</h1>
      <ul>
        {tours.map((t) => (
          <li key={t.slug}><h2><Link href={`/tours/${t.slug}`}>{t.title}</Link></h2><p>{t.days} days · {t.category}</p><p>{t.summary}</p></li>
        ))}
      </ul>
    </main>
  );
}
