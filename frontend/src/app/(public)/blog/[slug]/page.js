import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { articleJsonLd } from "@/lib/jsonld";
import { getPost, getPosts } from "@/services/content";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return {};
  return buildMetadata({
    title: p.title,
    description: p.excerpt,
    path: `/blog/${p.slug}`,
    image: p.image,
    type: "article",
    publishedTime: p.publishedAt,
    modifiedTime: p.updatedAt,
  });
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) notFound();

  return (
    <main>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]} />
      <article>
        <h1>{p.title}</h1>
        <p>By {p.author} · <time dateTime={p.publishedAt}>{p.publishedAt}</time></p>
        <div>{p.body}</div>
      </article>
      <JsonLd data={articleJsonLd(p)} />
    </main>
  );
}
