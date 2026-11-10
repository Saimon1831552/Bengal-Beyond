"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/destinations", label: "Destinations" },
  { href: "/tours", label: "Tours" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold text-primary" onClick={() => setOpen(false)}>
          {siteConfig.name}
        </Link>

        {/* Desktop */}
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                isActive(l.href) ? "text-primary" : "text-muted hover:text-primary"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Button href="/sign-in" variant="outline" rel="nofollow">
            Sign in
          </Button>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </Container>

      {/* Mobile menu */}
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-primary hover:bg-primary/10"
              >
                {l.label}
              </Link>
            ))}
            <Button href="/sign-in" variant="primary" className="mt-2" onClick={() => setOpen(false)}>
              Sign in
            </Button>
          </Container>
        </nav>
      )}
    </header>
  );
}