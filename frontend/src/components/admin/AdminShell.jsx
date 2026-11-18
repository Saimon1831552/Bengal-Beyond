"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import { Loading } from "@/components/account/State";
import DashboardShell from "@/components/dashboard/DashboardShell";
import useAccess from "@/hooks/useAccess";
import { loadAccess } from "@/lib/access";
import { ADMIN_NAV, buildNav } from "@/lib/navigation";
import { useAccessStore } from "@/store/useAccessStore";

export const useCan = () => {
  const permissions = useAccessStore((s) => s.permissions);
  return (perm) => permissions.includes(perm);
};

export default function AdminShell({ children }) {
  const a = useAccess();

  if (a.status === "idle" || a.status === "loading") return <Container className="py-10"><Loading /></Container>;
  if (a.status === "error") {
    return (
      <Container as="main" className="py-16 text-center">
        <p role="alert" className="text-terracotta">Couldn&apos;t load your permissions.</p>
        <button onClick={loadAccess} className="mt-4 font-semibold text-primary underline">Retry</button>
      </Container>
    );
  }

  const groups = buildNav(ADMIN_NAV, a);
  if (!a.isStaff || !groups.length) {
    return (
      <Container as="main" className="py-16 text-center">
        <h1 className="text-3xl text-primary">No access</h1>
        <p className="mt-3 text-muted">Your account doesn&apos;t have permission to view the admin area.</p>
        <Link href="/dashboard" className="mt-6 inline-block font-semibold text-accent underline">Go to my account</Link>
      </Container>
    );
  }
  return <DashboardShell groups={groups} label={a.isSuper ? "Super Admin" : "Admin"} topLink={{ href: "/dashboard", label: "My account" }}>{children}</DashboardShell>;
}
