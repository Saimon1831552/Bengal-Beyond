"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Magnetic from "@/components/fx/Magnetic";
import { siteConfig } from "@/config/site";
import { isAppRoute } from "@/lib/access";
import NewsletterSignup from "@/components/public/NewsletterSignup";

const columns = [
  { title: "Explore", links: [["/destinations", "Destinations"], ["/tours", "Tours"], ["/blog", "Travel blog"]] },
  {
    title: "Company",
    links: [
      ["/pages/about", "About Us"],
      ["/pages/terms", "Terms & Conditions"],
      ["/pages/privacy", "Privacy Policy"],
      ["/contact", "Contact"],
    ],
  },
];

const socials = [
  { key: "facebook", label: "Facebook", icon: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8z" /> },
  { key: "instagram", label: "Instagram", icon: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r=".6" /></> },
  { key: "youtube", label: "YouTube", icon: <><rect x="3" y="6" width="18" height="12" rx="4" /><path d="M10 9.5v5l4.5-2.5z" /></> },
  { key: "x", label: "X", icon: <path d="M5 5l14 14M19 5L5 19" /> },
];

export default function Footer({ info }) {
  const pathname = usePathname();
  const { social } = siteConfig;
  const contact = {
    email: info?.support_email || siteConfig.contact.email,
    phone: info?.support_phone || siteConfig.contact.phone,
  };
  if (isAppRoute(pathname)) return null;

  return (
    <footer className="mt-20 bg-brand text-sand">
      <Container className="py-20 text-center">
        <h2 className="mx-auto max-w-2xl text-4xl font-semibold text-white md:text-5xl">Ready for your next adventure?</h2>
        <div className="mt-8">
          <Magnetic>
            <Link href="/tours" data-burst className="inline-flex rounded-full btn-gold px-6 py-2.5 text-sm font-semibold">
              Start Your Journey
            </Link>
          </Magnetic>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl text-white">{siteConfig.name}</p>
            <p className="mt-3 max-w-xs text-sm text-sand/80">{siteConfig.tagline}</p>
            {contact.email && <p className="mt-4 break-words text-sm">{contact.email}</p>}
            {contact.phone && <p className="break-words text-sm">{contact.phone}</p>}
            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <motion.a
                  key={s.key} href={social[s.key] || "#"} aria-label={s.label}
                  whileHover={{ y: -4, rotate: 8, scale: 1.12 }} whileTap={{ scale: 0.92 }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-gold hover:text-gold"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </motion.a>
              ))}
            </div>
          </div>

          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold">{c.title}</p>
              <ul className="mt-4 space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="link-underline text-sm text-sand/90 hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Newsletter</p>
            <p className="mt-4 text-sm text-sand/80">Travel stories and offers, once a month.</p>
            <NewsletterSignup />
          </div>
        </Container>
        <Container className="border-t border-white/10 py-5 text-xs text-sand/70">
          © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}