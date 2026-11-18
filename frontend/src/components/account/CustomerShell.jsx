"use client";
import { usePathname } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import useAccess from "@/hooks/useAccess";
import { CUSTOMER_NAV } from "@/lib/navigation";

const BARE = ["/booking", "/payment-result"]; // checkout pages keep the marketing site chrome

export default function CustomerShell({ children }) {
  const pathname = usePathname();
  const a = useAccess();
  if (BARE.includes(pathname)) return children;
  return (
    <DashboardShell groups={CUSTOMER_NAV} label="My account" topLink={a.isStaff ? { href: "/admin", label: "Admin panel" } : null}>
      {children}
    </DashboardShell>
  );
}