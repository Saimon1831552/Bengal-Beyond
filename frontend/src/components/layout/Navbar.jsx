"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import Magnetic from "@/components/fx/Magnetic";
import AuthMenu from "./AuthMenu";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/destinations", label: "Destinations" },
  { href: "/tours", label: "Tours" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const overHero = isHome && !scrolled && !open;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const active = (h) => pathname === h || pathname.startsWith(`${h}/`);
  const tone = overHero ? "text-white" : "text-primary";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${
          overHero ? "border-white/20 bg-white/10" : "border-border bg-white/80 shadow-sm"
        }`}
      >
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" onClick={() => setOpen(false)} className={`font-display text-xl font-semibold ${tone}`}>
            {siteConfig.name}
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={`relative text-sm font-medium ${tone} after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:bg-current after:transition-transform after:duration-300 ${
                  active(l.href) ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <AuthMenu tone={tone} />
            <Magnetic>
              <Link
                href="/tours"
                data-burst
                className="inline-flex rounded-full btn-gold px-6 py-2.5 text-sm font-semibold"
              >
                Book Now
              </Link>
            </Magnetic>
          </nav>

          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center md:hidden ${tone}`}
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

        {open && (
          <nav id="mobile-menu" aria-label="Mobile" className="border-t border-border bg-white md:hidden">
            <Container className="flex flex-col gap-1 py-3">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium text-primary hover:bg-primary/10">
                  {l.label}
                </Link>
              ))}
              <div className="px-3 py-2"><AuthMenu onNavigate={() => setOpen(false)} /></div>
              <Link href="/tours" data-burst onClick={() => setOpen(false)} className="mt-2 flex w-full justify-center rounded-full btn-gold px-6 py-2.5 text-sm font-semibold">
                Book Now
              </Link>
            </Container>
          </nav>
        )}
      </header>
      {!isHome && <div className="h-16" aria-hidden="true" />}
    </>
  );
}