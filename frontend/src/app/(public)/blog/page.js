import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getPosts } from "@/services/content";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata = buildMetadata({
  title: "Bangladesh Travel Blog & Guides",
  description: "Travel guides, local food stories, cultural experiences and practical tips for visiting Bangladesh.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <main>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} />
      <h1>Bangladesh Travel Blog</h1>
      <ul>{posts.map((p) => <li key={p.slug}><h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2><p>{p.excerpt}</p></li>)}</ul>
    </main>
  );
}
