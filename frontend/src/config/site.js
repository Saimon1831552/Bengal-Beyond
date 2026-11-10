export const siteConfig = {
  name: "Bengal Beyond",
  legalName: "Bengal Beyond",
  tagline: "Discover Bangladesh. Beyond the Ordinary.",
  description:
    "Premium guided tours and travel experiences in Bangladesh: Sundarbans mangrove cruises, Cox's Bazar beaches, Sylhet tea country, Sajek Valley and more.",
  // Set NEXT_PUBLIC_SITE_URL in .env.local / hosting dashboard (no trailing slash)
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_US",
  language: "en",
  themeColor: "#123D32",
  backgroundColor: "#F8F7F2",
  keywords: [
    "Bangladesh tours",
    "Bangladesh travel",
    "Sundarbans tour",
    "Cox's Bazar",
    "Sylhet tea gardens",
    "Sajek Valley",
    "Bangladesh tourism",
  ],
  // Fill these in before launch
  contact: { email: "", phone: "", address: { street: "", city: "", country: "BD" } },
  social: {
    // full profile URLs, used in Organization JSON-LD `sameAs`
    facebook: "",
    instagram: "",
    youtube: "",
    x: "",
  },
  twitterHandle: "", // e.g. "@bengalbeyond"
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || "",
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
  },
};

// Routes that must never be indexed
export const privatePaths = ["/admin", "/dashboard", "/booking", "/sign-in", "/api"];
