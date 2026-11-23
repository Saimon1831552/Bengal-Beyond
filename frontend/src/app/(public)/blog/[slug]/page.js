import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { articleJsonLd } from "@/lib/jsonld";
import { getPost, getPosts } from "@/services/content";
import Image from "@/components/ui/RemoteImage";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { formatDate } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    return (await getPosts()).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
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
    modifiedTime: p.updatedAt || p.publishedAt,
  });
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) notFound();

  return (
    <main>
      <Container className="pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]} />
      </Container>

      <Container as="article" className="max-w-3xl py-8">
        <h1 className="font-display text-3xl text-primary md:text-5xl">{p.title}</h1>
        <p className="mt-3 text-sm text-muted">
          By {p.author || "Bengal Beyond"} · <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
        </p>
        {p.image && (
          <div className="relative my-6 aspect-[16/9] overflow-hidden rounded-3xl">
            <Image src={p.image} alt={p.title} fill priority className="object-cover" />
          </div>
        )}
        <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground/85">
          {p.body.split(/\n{2,}/).filter(Boolean).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      </Container>
      <JsonLd data={articleJsonLd(p)} />
    </main>
  );
}