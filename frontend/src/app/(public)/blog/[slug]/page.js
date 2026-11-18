import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { articleJsonLd } from "@/lib/jsonld";
import { getPost, getPosts } from "@/services/content";
import Image from "@/components/ui/RemoteImage";
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
        {p.image && <div className="relative my-6 aspect-[16/9] overflow-hidden rounded-3xl"><Image src={p.image} alt={p.title} fill priority className="object-cover" /></div>}
        <div className="space-y-4 text-foreground/85">
          {p.body.split(/\n{2,}/).filter(Boolean).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
        </div>
      </article>
      <JsonLd data={articleJsonLd(p)} />
    </main>
  );
}
