import { absoluteUrl } from "@/lib/seo";
import { getDestinations, getTours, getPosts } from "@/services/content";

const BUILD_DATE = new Date();

export default async function sitemap() {
  const [destinations, tours, posts] = await Promise.all([getDestinations(), getTours(), getPosts()]);

  const staticRoutes = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/destinations", priority: 0.9, changeFrequency: "weekly" },
    { path: "/tours", priority: 0.9, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/about", priority: 0.5, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  ].map((r) => ({ url: absoluteUrl(r.path), lastModified: BUILD_DATE, changeFrequency: r.changeFrequency, priority: r.priority }));

  const entry = (base, item, priority) => ({
    url: absoluteUrl(`${base}/${item.slug}`),
    lastModified: new Date(item.updatedAt || item.publishedAt),
    changeFrequency: "monthly",
    priority,
  });

  return [
    ...staticRoutes,
    ...destinations.map((d) => entry("/destinations", d, 0.8)),
    ...tours.map((t) => entry("/tours", t, 0.8)),
    ...posts.map((p) => entry("/blog", p, 0.6)),
  ];
}
