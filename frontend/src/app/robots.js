import { siteConfig, privatePaths } from "@/config/site";

export default function robots() {
  const isProd = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";

  // Never let staging / preview deployments get indexed
  if (!isProd) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: privatePaths.map((p) => `${p}/`).concat(privatePaths) }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
