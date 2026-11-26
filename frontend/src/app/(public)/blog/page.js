import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getPosts } from "@/services/content";

export const revalidate = 60;

export const metadata = buildMetadata({
  title: `Travel Journal & Field Notes — ${siteConfig.name}`,
  description:
    "Stories, seasonal guides, permit tips, and cultural dispatches from across Bangladesh—written by local naturalists and trip planners.",
  path: "/blog",
});

const FALLBACK_POSTS = [
  {
    id: "fallback-1",
    slug: "best-places-to-visit-in-bangladesh",
    title: "Best Places to Visit in Bangladesh: A Season-by-Season Route Guide",
    excerpt:
      "How to pair winter mangrove cruises in the Sundarbans with spring tea harvests in Srimangal and monsoon cloud ridges in Bandarban.",
    author: "Bengal Beyond Editorial",
    publishedAt: "2026-11-12",
    body: "",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "fallback-2",
    slug: "travel-tips-for-first-time-visitors",
    title: "First-Time Visitor's Field Manual: Permits, Trains, SIM Cards & Etiquette",
    excerpt:
      "Everything you need before landing in Dhaka—from Forest Department clearances and Chattogram hill permits to navigating Old Dhaka on foot.",
    author: "Bengal Beyond Editorial",
    publishedAt: "2026-11-05",
    body: "",
    image:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80",
  },
];

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80";

function estimateReadTime(text) {
  const words = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(2, Math.round(words / 200))} min read`;
}

function formatDate(value) {
  if (!value) return "Latest Dispatch";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPage({ searchParams }) {
  const params = (await searchParams) || {};
  const query = String(params.q || "").trim().toLowerCase();

  const livePosts = await getPosts();
  const posts = (livePosts.length > 0 ? livePosts : FALLBACK_POSTS).map((p) => ({
    ...p,
    image: p.image || DEFAULT_COVER,
    readTime: estimateReadTime(p.body || p.excerpt),
  }));

  const filtered = query
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.excerpt.toLowerCase().includes(query) ||
          p.body.toLowerCase().includes(query)
      )
    : posts;

  const [featured, ...rest] = filtered;

  return (
    <main className="bg-background pb-20 text-foreground">
      <section className="border-b border-border bg-primary-dark py-16 text-white sm:py-22">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Bengal Beyond Journal · {posts.length} Dispatches
          </p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-semibold sm:text-5xl">
                Field notes, seasonal guides & river stories.
              </h1>
              <p className="mt-3 text-sm text-sand/85 sm:text-base">
                Written by our naturalists, heritage researchers, and trip planners across
                Bangladesh.
              </p>
            </div>

            <form action="/blog" method="get" className="flex w-full max-w-md gap-2">
              <input
                type="search"
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search destinations, permits, seasons…"
                aria-label="Search journal articles"
                className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white placeholder:text-white/60 outline-none backdrop-blur focus:border-gold sm:text-sm"
              />
              <button
                type="submit"
                className="btn-gold shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold"
              >
                Search
              </button>
            </form>
          </div>
        </Container>
      </section>

      <Container className="mt-12">
        {!featured ? (
          <div className="rounded-3xl border border-border bg-white p-10 text-center">
            <p className="font-display text-xl font-semibold text-primary">
              No journal articles matched &ldquo;{params.q}&rdquo;.
            </p>
            <p className="mt-2 text-sm text-muted">
              Try a broader keyword or browse all published dispatches.
            </p>
            <Link
              href="/blog"
              className="btn-gold mt-5 inline-block rounded-full px-6 py-2.5 text-xs font-semibold"
            >
              Show All Articles
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Lead Story */}
            <article className="group overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition hover:shadow-xl">
              <Link href={`/blog/${featured.slug}`} className="grid grid-cols-1 lg:grid-cols-12">
                <div className="relative aspect-[16/10] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[22rem]">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                        Featured Dispatch
                      </span>
                      <span className="text-muted">· {featured.readTime}</span>
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-semibold leading-snug text-primary group-hover:text-accent sm:text-3xl">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{featured.excerpt}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                    <span className="text-muted">
                      {featured.author} · {formatDate(featured.publishedAt)}
                    </span>
                    <span className="font-semibold text-primary transition-transform group-hover:translate-x-1">
                      Read full story →
                    </span>
                  </div>
                </div>
              </Link>
            </article>

            {/* Remaining Articles Grid */}
            {rest.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-white transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-6">
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-accent">{post.author}</span>
                            <span className="text-muted">· {post.readTime}</span>
                          </div>
                          <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-primary group-hover:text-accent">
                            {post.title}
                          </h3>
                          <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-xs">
                          <span className="text-muted">{formatDate(post.publishedAt)}</span>
                          <span className="font-semibold text-primary">Read →</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </Container>
    </main>
  );
}