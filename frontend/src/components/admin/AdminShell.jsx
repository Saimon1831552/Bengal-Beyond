"use client";
import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import { Loading } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";

const NAV = [
  { href: "/admin", label: "Dashboard", perm: "dashboard.read", exact: true },
  { href: "/admin/bookings", label: "Bookings", perm: "bookings.read" },
  { href: "/admin/tours", label: "Tours", perm: "tours.manage" },
  { href: "/admin/payments", label: "Payments", perm: "payments.read" },
];

const Ctx = createContext([]);
export const useCan = () => { const p = useContext(Ctx); return (perm) => p.includes(perm); };

export default function AdminShell({ children }) {
  const { data, error, loading } = useFetch("/me/permissions");
  const pathname = usePathname();

  if (loading) return <Container className="py-10"><Loading /></Container>;
  const perms = data?.permissions || [];
  const items = NAV.filter((n) => perms.includes(n.perm));

  if (error || !items.length) {
    return (
      <Container as="main" className="py-16 text-center">
        <h1 className="text-3xl text-primary">No access</h1>
        <p className="mt-3 text-muted">Your account doesn&apos;t have permission to view the admin area.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-accent underline">Back to site</Link>
      </Container>
    );
  }

  return (
    <Ctx.Provider value={perms}>
      <Container className="pt-8">
        <nav aria-label="Admin" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
          {items.map((n) => {
            const on = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${on ? "bg-primary text-white" : "text-primary hover:bg-primary/10"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </Container>
      {children}
    </Ctx.Provider>
  );
}