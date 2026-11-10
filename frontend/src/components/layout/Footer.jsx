import Link from "next/link";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/destinations", label: "Destinations" },
      { href: "/tours", label: "Tours" },
      { href: "/blog", label: "Travel blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export default function Footer() {
  const { contact } = siteConfig;
  return (
    <footer className="mt-20 bg-primary-dark text-sand">
      <Container className="grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-white">{siteConfig.name}</p>
          <p className="mt-3 max-w-xs text-sm text-sand/80">{siteConfig.tagline}</p>
          {contact.email && <p className="mt-4 text-sm">{contact.email}</p>}
          {contact.phone && <p className="text-sm">{contact.phone}</p>}
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">{col.title}</p>
            <ul className="mt-4 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm !text-sand/90 hover:!text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <div className="border-t border-white/10">
        <Container className="py-5 text-xs text-sand/70">
          © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}