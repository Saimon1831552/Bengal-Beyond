import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";

const clean = (obj) => JSON.parse(JSON.stringify(obj)); // drops undefined / empty

export const organizationJsonLd = () => {
  const { contact, social } = siteConfig;
  return clean({
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": absoluteUrl("/#organization"),
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icons/logo.png"),
    description: siteConfig.description,
    email: contact.email || undefined,
    telephone: contact.phone || undefined,
    address: contact.address.city
      ? { "@type": "PostalAddress", streetAddress: contact.address.street, addressLocality: contact.address.city, addressCountry: contact.address.country }
      : undefined,
    sameAs: Object.values(social).filter(Boolean),
  });
};

export const websiteJsonLd = () =>
  clean({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: siteConfig.url,
    name: siteConfig.name,
    inLanguage: siteConfig.language,
    publisher: { "@id": absoluteUrl("/#organization") },
  });

export const breadcrumbJsonLd = (items) =>
  clean({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });

export const destinationJsonLd = (d) =>
  clean({
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: d.name,
    description: d.summary,
    url: absoluteUrl(`/destinations/${d.slug}`),
    image: d.image ? absoluteUrl(d.image) : undefined,
    geo: { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng },
    touristType: d.interests,
    containedInPlace: { "@type": "Country", name: "Bangladesh" },
  });

// Only emit `offers` when a real price exists, so we never publish placeholder data
export const tourJsonLd = (t) =>
  clean({
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: t.title,
    description: t.summary,
    url: absoluteUrl(`/tours/${t.slug}`),
    image: t.image ? absoluteUrl(t.image) : undefined,
    touristType: t.category,
    itinerary: t.destinations?.map((slug) => ({ "@type": "Place", name: slug, url: absoluteUrl(`/destinations/${slug}`) })),
    provider: { "@id": absoluteUrl("/#organization") },
    offers: t.price
      ? { "@type": "Offer", price: t.price, priceCurrency: t.currency || "USD", availability: "https://schema.org/InStock", url: absoluteUrl(`/tours/${t.slug}`) }
      : undefined,
    // Add aggregateRating ONLY from real, visible reviews
  });

export const articleJsonLd = (p) =>
  clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.excerpt,
    image: p.image ? absoluteUrl(p.image) : undefined,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt || p.publishedAt,
    author: { "@type": "Person", name: p.author },
    publisher: { "@id": absoluteUrl("/#organization") },
    mainEntityOfPage: absoluteUrl(`/blog/${p.slug}`),
  });

export const faqJsonLd = (faqs) =>
  clean({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });
