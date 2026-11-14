"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money, formatDate, titleCase } from "@/lib/format";

const STATUSES = ["draft", "published", "unpublished", "archived"];
const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminTours() {
  const [f, setF] = useState({ q: "", status: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page, limit: 20 });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { data, meta, error, loading, reload } = useFetch(`/admin/tours?${qs}`);

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-primary">Tours</h1>
        <Link href="/admin/tours/new" className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold">New tour</Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(f); }} className="mt-6 flex flex-wrap gap-3">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Title, destination, slug" aria-label="Search" className={`${sel} w-64`} />
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel} aria-label="Status">
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !data.length ? <div className="p-6"><Empty>No tours yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-5 py-3">Tour</th><th>Destination</th><th>Days</th><th>Status</th><th>Updated</th><th className="pr-5 text-right">Price</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((t) => (
                <tr key={t.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3"><Link href={`/admin/tours/${t.id}`} className="font-semibold text-primary underline">{t.title}</Link><br /><span className="text-xs text-muted">/{t.slug}</span></td>
                  <td>{t.destination}</td><td>{t.duration_days}</td>
                  <td><StatusBadge value={t.status} /></td><td>{formatDate(t.updated_at)}</td>
                  <td className="pr-5 text-right font-semibold text-primary">{money(t.base_price, t.currency_code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40">Previous</button>
          <span>Page {page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}