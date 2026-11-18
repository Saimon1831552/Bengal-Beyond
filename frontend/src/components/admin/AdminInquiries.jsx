"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { formatDateTime, titleCase } from "@/lib/format";

const STATUS = ["open", "in_progress", "waiting_customer", "resolved", "closed"];
const PRIORITY = ["urgent", "high", "normal", "low"];
const CATEGORY = ["general", "booking", "payment", "refund", "tour", "account", "technical", "other"];
const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminInquiries() {
  const [f, setF] = useState({ q: "", status: "", priority: "", category: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page, limit: 20 });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { data, error, loading, reload } = useFetch(`/admin/support?${qs}`);
  const pg = data?.pagination;
  const pages = pg ? Math.max(1, Math.ceil(pg.total / pg.limit)) : 1;
  const opts = (label, list) => <><option value="">{label}</option>{list.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</>;

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Customer inquiries</h1>
      <p className="mt-2 text-sm text-muted">Sorted by priority, then most recent message.</p>
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(f); }} className="mt-6 flex flex-wrap gap-3">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Reference, subject, email" aria-label="Search" className={`${sel} w-64`} />
        <select aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel}>{opts("All statuses", STATUS)}</select>
        <select aria-label="Priority" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className={sel}>{opts("All priorities", PRIORITY)}</select>
        <select aria-label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={sel}>{opts("All categories", CATEGORY)}</select>
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !data.items.length ? <div className="p-6"><Empty>No inquiries.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">Ticket</th><th>From</th><th>Category</th><th>Priority</th><th>Status</th><th className="pr-5">Last message</th></tr></thead>
            <tbody className="divide-y divide-border">
              {data.items.map((t) => (
                <tr key={t.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3"><Link href={`/admin/inquiries/${t.id}`} className="font-semibold text-primary underline">{t.subject}</Link><br /><span className="font-mono text-xs text-muted">{t.ticket_reference}</span></td>
                  <td>{t.guest_name || t.account_email}<br /><span className="text-xs text-muted">{t.guest_email || (t.user_id ? "Registered customer" : "")}</span></td>
                  <td>{titleCase(t.category)}</td>
                  <td><StatusBadge value={t.priority} /></td>
                  <td><StatusBadge value={t.status} /></td>
                  <td className="whitespace-nowrap pr-5">{formatDateTime(t.last_message_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}