import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getPost, getPosts } from "@/services/content";

export const revalidate = 60;

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.filter((p) => p.slug).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return buildMetadata({
      title: `Travel Journal — ${siteConfig.name}`,
      path: `/blog/${slug}`,
    });
  }
  return buildMetadata({
    title: `${post.title} — ${siteConfig.name} Journal`,
    description: post.excerpt || "",
    path: `/blog/${slug}`,
  });
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([getPost(slug), getPosts()]);

  if (!post) notFound();

  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3);
  const cover = post.image || DEFAULT_COVER;
  const body = String(post.body || post.excerpt || "");

  return (
    <main className="bg-background pb-20 text-foreground">
      <header className="bg-primary-dark py-14 text-white sm:py-20">
        <Container className="max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:underline"
          >
            ← Back to Journal
          </Link>
          <h1 className="mt-4 font-display text-gold text-3xl font-semibold leading-tight sm:text-5xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-sand/85">
            <span>{post.author}</span>
            {post.publishedAt && (
              <span>
                ·{" "}
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </Container>
      </header>

      <Container className="max-w-4xl">
        <div className="relative -mt-8 aspect-[16/9] overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
          <Image
            src={cover}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        <article
          className="blog-prose mx-auto mt-10 max-w-3xl text-base text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(body) }}
        />

        {related.length > 0 && (
          <section className="mx-auto mt-14 max-w-3xl border-t border-border pt-10">
            <h2 className="font-display text-xl font-semibold text-primary">
              More from the Bengal Beyond Journal
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id || item.slug}
                  href={`/blog/${item.slug}`}
                  className="group rounded-2xl border border-border bg-white p-4 transition hover:border-primary/40 hover:shadow-md"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                    {item.publishedAt || "Journal"}
                  </p>
                  <p className="mt-1.5 line-clamp-2 font-display text-sm font-semibold text-primary group-hover:text-accent">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-border bg-white p-6 sm:flex sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Experience This Route
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-primary">
              Want to explore this region with a local guide?
            </h2>
          </div>
          <Link
            href="/tours"
            className="btn-gold mt-4 inline-block shrink-0 rounded-full px-6 py-3 text-xs font-semibold sm:mt-0"
          >
            View Departures
          </Link>
        </div>
      </Container>
    </main>
  );
}