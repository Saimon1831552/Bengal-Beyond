"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDateTime } from "@/lib/format";
import { errMsg } from "@/lib/errors";

function Row({ r, reload }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const decide = async (action) => {
    const warn = action === "approve"
      ? `Approve and CANCEL booking ${r.booking_reference}? Seats are released. Create a refund afterwards if it was paid.`
      : "Reject this request?";
    if (!window.confirm(warn)) return;
    setBusy(action); setMsg("");
    try { await api.post(`/admin/cancellation-requests/${r.id}/${action}`, note.trim() ? { note: note.trim() } : {}); await reload(); }
    catch (e) { setMsg(errMsg(e)); } finally { setBusy(""); }
  };

  return (
    <li className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/admin/bookings/${r.booking_id}`} className="font-semibold text-primary underline">{r.booking_reference}</Link>
          <span className="ml-2 text-sm text-muted">{r.customer_name} · {formatDateTime(r.created_at)}</span>
        </div>
        <div className="flex items-center gap-2"><StatusBadge value={r.booking_status} /><StatusBadge value={r.payment_status} /><span className="font-semibold text-primary">{money(r.total_amount, r.currency_code)}</span></div>
      </div>
      <p className="mt-3 rounded-xl bg-background p-3 text-sm">&ldquo;{r.reason}&rdquo;</p>
      {r.status === "pending" ? (
        <div className="mt-4 space-y-3">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} aria-label="Note"
            placeholder="Note (a rejection note is shown to the customer)" className="w-full rounded-xl border border-border px-4 py-2 text-sm outline-none focus:border-accent" />
          <div className="flex gap-3">
            <button onClick={() => decide("approve")} disabled={!!busy} className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === "approve" ? "…" : "Approve & cancel booking"}</button>
            <button onClick={() => decide("reject")} disabled={!!busy} className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-50">{busy === "reject" ? "…" : "Reject"}</button>
          </div>
          {msg && <p role="alert" className="text-sm text-terracotta">{msg}</p>}
        </div>
      ) : <p className="mt-3 text-sm"><StatusBadge value={r.status} /> <span className="text-muted">{formatDateTime(r.reviewed_at)}</span></p>}
    </li>
  );
}

export default function AdminCancellations() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useFetch(`/admin/cancellation-requests?page=${page}&limit=20${status ? `&status=${status}` : ""}`);
  return (
    <Container as="main" className="max-w-4xl py-8">
      <h1 className="text-3xl text-primary">Cancellation requests</h1>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status" className="mt-6 rounded-xl border border-border bg-white px-3 py-2 text-sm">
        <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option>
      </select>
      <div className="mt-6">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : !data.length ? <Empty>Nothing here.</Empty> :
          <ul className="space-y-4">{data.map((r) => <Row key={r.id} r={r} reload={reload} />)}</ul>}
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