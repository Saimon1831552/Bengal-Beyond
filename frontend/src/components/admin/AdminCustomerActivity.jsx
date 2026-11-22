"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { formatDateTime, titleCase } from "@/lib/format";

const ENTITIES = ["", "booking", "payment", "customer", "user", "tour", "refund"];
const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminCustomerActivity() {
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ page, limit: 25 });
  if (entityType) qs.set("entityType", entityType);
  const { data, error, loading, reload } = useFetch(`/admin/activity?${qs}`);

  const items = data?.items || [];
  const pg = data?.pagination;

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Activity feed</h1>
      <p className="mt-1 text-sm text-muted">Unified timeline of booking status updates, notes, payments, and audit events.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          aria-label="Entity type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className={sel}
        >
          <option value="">All entity types</option>
          {ENTITIES.filter(Boolean).map((t) => (
            <option key={t} value={t}>{titleCase(t)}</option>
          ))}
        </select>
        {pg?.total != null && <span className="text-sm text-muted">{pg.total} events</span>}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !items.length ? (
          <div className="p-6"><Empty>No activity events found.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th className="pr-5">Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-primary/5">
                  <td className="whitespace-nowrap px-5 py-3">{formatDateTime(a.createdAt)}</td>
                  <td>{a.actor ? `${a.actor.name} (#${a.actor.id})` : <span className="text-muted">System / Guest</span>}</td>
                  <td className="font-mono text-xs">{a.action}</td>
                  <td className="text-xs">
                    {a.resource ? (
                      <Link href={a.resource.href} className="font-semibold text-primary underline">
                        {titleCase(a.resource.type)} #{a.resource.id}
                      </Link>
                    ) : (
                      <span>{a.entityType}{a.entityId ? ` #${a.entityId}` : ""}</span>
                    )}
                  </td>
                  <td className="pr-5 font-mono text-xs text-muted">{a.requestId || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pg?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {pg.totalPages}</span>
          <button disabled={page >= pg.totalPages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}