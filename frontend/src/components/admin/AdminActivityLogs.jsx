"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { formatDateTime } from "@/lib/format";

export default function AdminActivityLogs() {
  const [tab, setTab] = useState("");            // "" | "/security-events"
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useFetch(`/admin/audit-logs${tab}?page=${page}&limit=25${search ? `&search=${encodeURIComponent(search)}` : ""}`);

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Activity logs</h1>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {[["", "All activity"], ["/security-events", "Security events"]].map(([v, l]) => (
          <button key={v} onClick={() => { setTab(v); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === v ? "bg-primary text-white" : "border border-border bg-white text-primary"}`}>{l}</button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }} className="ml-auto flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action, user, request id" aria-label="Search" className="w-60 rounded-xl border border-border bg-white px-3 py-2 text-sm" />
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !data.length ? <div className="p-6"><Empty>No events.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">When</th><th>Actor</th><th>Action</th><th>Entity</th><th>IP</th><th>Result</th></tr></thead>
            <tbody className="divide-y divide-border">
              {data.map((l) => {
                const outcome = l.after_data?.outcome;
                return (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-5 py-3">{formatDateTime(l.created_at)}</td>
                    <td>{l.actor_name || <span className="text-muted">anonymous</span>}</td>
                    <td className="font-mono text-xs">{l.action}</td>
                    <td className="text-xs">{l.entity_type}{l.entity_id ? ` #${l.entity_id}` : ""}</td>
                    <td className="font-mono text-xs">{l.ip_address || "—"}</td>
                    <td>{outcome && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${outcome === "success" ? "bg-accent/15 text-primary" : "bg-terracotta/15 text-terracotta"}`}>{outcome}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {meta?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}