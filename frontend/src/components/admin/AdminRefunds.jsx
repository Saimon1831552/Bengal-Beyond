"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import RefundActions from "./RefundActions";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money, formatDateTime, titleCase } from "@/lib/format";

const STATUSES = ["requested", "pending", "succeeded", "failed", "cancelled"];

export default function AdminRefunds() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch(`/admin/refunds?page=${page}&limit=20${status ? `&status=${status}` : ""}`);
  const pg = data?.pagination;
  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Refunds</h1>
      <p className="mt-2 text-sm text-muted">Create refunds from the booking page. Submitted refunds stay &ldquo;pending&rdquo; until the gateway confirms.</p>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status" className="mt-6 rounded-xl border border-border bg-white px-3 py-2 text-sm">
        <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
      </select>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !data.items.length ? <div className="p-6"><Empty>No refunds.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">Booking</th><th>Created</th><th>Reason</th><th>Status</th><th className="text-right">Amount</th><th className="pr-5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-border">
              {data.items.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-5 py-3"><Link href={`/admin/bookings/${r.booking_id}`} className="font-semibold text-primary underline">{r.booking_reference}</Link><br /><span className="text-xs text-muted">{r.customer_email}</span></td>
                  <td>{formatDateTime(r.created_at)}</td><td className="max-w-[14rem]">{r.reason || "—"}</td>
                  <td><StatusBadge value={r.status} /></td>
                  <td className="text-right font-semibold text-primary">{money(r.amount, r.currency_code)}</td>
                  <td className="py-3 pr-5"><RefundActions refund={r} provider={r.provider} onDone={reload} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pg?.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {pg.pages}</span>
          <button disabled={page >= pg.pages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}