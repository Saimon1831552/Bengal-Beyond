"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

const split = (href) => { const [path, q = ""] = href.split("?"); return { path, q: new URLSearchParams(q) }; };

function Nav({ groups, onNavigate }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState({});
  const flat = groups.flatMap((g) => g.items);

  const matches = (i) => {
    const { path, q } = split(i.href);
    if (pathname !== path) return !i.href.includes("?") && !i.exact && pathname.startsWith(`${path}/`);
    for (const [k, v] of q) if (sp.get(k) !== v) return false;
    return true;
  };
  const queryHit = flat.some((i) => i.href.includes("?") && matches(i));
  const active = (i) => (i.href.includes("?") ? matches(i) : matches(i) && !(queryHit && split(i.href).path === pathname));

  return (
    <nav aria-label="Dashboard" className="space-y-1 px-3 pb-8">
      {groups.map((g) => {
        const isOpen = open[g.title] ?? (g.defaultOpen || g.items.some(active));
        return (
          <div key={g.title}>
            <button type="button" onClick={() => setOpen({ ...open, [g.title]: !isOpen })} aria-expanded={isOpen}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sand/60 hover:text-sand">
              {g.title}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {isOpen && (
              <ul className="mb-2 space-y-0.5">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} onClick={onNavigate} aria-current={active(i) ? "page" : undefined}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${active(i) ? "bg-gold font-semibold text-primary-dark" : "text-sand/90 hover:bg-white/10"}`}>
                      {i.label}
                      {i.status === "soon" && <span className="rounded bg-white/15 px-1.5 text-[10px] uppercase">Soon</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default function DashboardShell({ groups, label, topLink, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [pathname]);

  const crumbs = pathname.split("/").filter(Boolean).map((s) => (/^\d+$/.test(s) ? `#${s}` : s.replace(/-/g, " ")));
  const initial = (user?.fullName || user?.email || "?")[0].toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col bg-primary-dark">
      <div className="px-6 py-5">
        <Link href="/" className="font-display text-xl text-white">{siteConfig.name}</Link>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{label}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={null}><Nav groups={groups} onNavigate={() => setDrawer(false)} /></Suspense>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-white/85 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <nav aria-label="Breadcrumb" className="truncate text-sm capitalize text-muted">{crumbs.join(" / ")}</nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {topLink && <Link href={topLink.href} className="hidden font-semibold text-accent sm:inline">{topLink.label}</Link>}
            <Link href="/" className="hidden text-muted hover:text-primary sm:inline">View site ↗</Link>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-white" aria-hidden="true">{initial}</span>
              <span className="max-w-[10rem] truncate font-medium text-primary">{user?.fullName || user?.email}</span>
            </span>
            <button onClick={async () => { await authService.logout(); router.push("/"); }} className="font-semibold text-terracotta">Log out</button>
          </div>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}