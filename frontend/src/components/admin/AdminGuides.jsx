"use client";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";

export default function AdminGuides() {
  const { data, error, loading, reload } = useFetch("/admin/guides");

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Tour guides &amp; operators</h1>
          <p className="mt-1 text-sm text-muted">Active guides, tour operators, and operations staff with workload counts.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/assignments" className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary">
            Manage assignments
          </Link>
          <Link href="/admin/staff" className="btn-gold rounded-full px-5 py-2 text-sm font-semibold">
            Staff &amp; roles
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !data.length ? (
          <div className="p-6"><Empty>No guides or operators found.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Guide / Staff</th>
                <th>Contact</th>
                <th>Roles</th>
                <th>Active Assignments</th>
                <th className="pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((g) => (
                <tr key={g.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3">
                    <span className="font-semibold text-primary">{g.full_name}</span>
                    {g.nationality && <span className="block text-xs text-muted">{g.nationality}</span>}
                  </td>
                  <td>
                    <span>{g.email}</span>
                    {g.phone && <span className="block text-xs text-muted">{g.phone}</span>}
                  </td>
                  <td className="text-xs font-medium text-primary">{g.roles}</td>
                  <td>
                    <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-primary">
                      {g.active_assignments} assigned
                    </span>
                  </td>
                  <td className="pr-5"><StatusBadge value={g.account_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
}