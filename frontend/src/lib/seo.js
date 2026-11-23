import { siteConfig } from "@/config/site";

export const absoluteUrl = (path = "/") => new URL(path, `${siteConfig.url}/`).toString();

/**
 * One place to build page metadata so every page gets
 * title, canonical, Open Graph and Twitter tags consistently.
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image,
  type = "website",
  noIndex = false,
  keywords,
  publishedTime,
  modifiedTime,
} = {}) {
  const url = absoluteUrl(path);
  const resolvedTitle = title || siteConfig.name;
  const images = image
    ? [{ url: absoluteUrl(image), width: 1200, height: 630, alt: resolvedTitle }]
    : undefined;

  return {
    ...(title && { title }),
    description,
    keywords: keywords || siteConfig.keywords,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title: resolvedTitle,
      description,
      ...(images && { images }),
      ...(type === "article" && { publishedTime, modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      ...(images && { images: images.map((i) => i.url) }),
      ...(siteConfig.twitterHandle && { creator: siteConfig.twitterHandle }),
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

export const noIndexMetadata = {
  robots: { index: false, follow: false, nocache: true },
};