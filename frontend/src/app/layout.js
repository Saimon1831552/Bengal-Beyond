import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import JsonLd from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";

// Self-hosted by Next: no render-blocking Google Fonts request, no layout shift
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", style: ["normal", "italic"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: {
    google: siteConfig.verification.google || undefined,
    other: siteConfig.verification.bing ? { "msvalidate.01": siteConfig.verification.bing } : undefined,
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang={siteConfig.language} className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        {/* TODO: <Navbar /> from components/layout */}
        <div id="main">{children}</div>
        {/* TODO: <Footer /> */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}
