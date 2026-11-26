"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import { useAuthStore } from "@/store/useAuthStore";
import { useAccessStore } from "@/store/useAccessStore";
import api from "@/lib/axios";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tours", label: "Tours" },
  { href: "/destinations", label: "Destinations" },
  { href: "/blog", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAdmin = useAccessStore((s) =>
    Boolean(s.roles?.some((r) => r === "admin" || r === "super_admin" || r?.name === "admin"))
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    clearAuth();
    setMenuOpen(false);
    router.push("/");
  };

  const dashboardHref =
    user?.role === "admin" || isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel =
    user?.role === "admin" || isAdmin ? "Admin Panel" : "My Trips";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3 sm:h-20">
        <Link href="/" className="flex items-center gap-2.5 text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-dark font-display text-lg font-bold text-gold">
            B
          </span>
          <span className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            Bengal Beyond
          </span>
        </Link>

        {/* Desktop Links */}
        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  active ? "font-semibold text-primary" : "text-muted hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary"
              >
                {dashboardLabel}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-medium text-muted hover:text-terracotta"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-3 py-2 text-sm font-medium text-primary hover:text-accent"
              >
                Sign in
              </Link>
              <Link
                href="/tours"
                className="btn-gold rounded-full px-5 py-2.5 text-xs font-semibold"
              >
                Book a Tour
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="bb-mobile-nav"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-primary lg:hidden"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </Container>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          id="bb-mobile-nav"
          className="border-t border-border bg-background px-4 pb-8 pt-4 shadow-xl lg:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-base font-medium ${
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-full border border-primary bg-white py-3 text-center text-sm font-semibold text-primary"
                >
                  {dashboardLabel}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-full py-2.5 text-center text-sm font-medium text-terracotta"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-full border border-border bg-white py-3 text-center text-sm font-semibold text-primary"
                >
                  Sign in
                </Link>
                <Link
                  href="/tours"
                  onClick={() => setMenuOpen(false)}
                  className="btn-gold w-full rounded-full py-3 text-center text-sm font-semibold"
                >
                  Explore & Book Tours
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}