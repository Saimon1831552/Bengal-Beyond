"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money, formatDate, titleCase } from "@/lib/format";

const BOOKING = ["pending_review", "awaiting_payment", "confirmed", "rejected", "cancellation_requested", "cancelled", "completed", "expired"];
const PAYMENT = ["unpaid", "pending", "paid", "failed", "partially_refunded", "refunded", "not_required"];
const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminBookings() {
  const [f, setF] = useState({ q: "", status: "", payment_status: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ page, limit: 20 });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { data, error, loading, reload } = useFetch(`/admin/bookings?${qs}`);

  const search = (e) => { e.preventDefault(); setPage(1); setApplied(f); };
  const pg = data?.pagination;

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Bookings</h1>
      <form onSubmit={search} className="mt-6 flex flex-wrap items-end gap-3">
        <input placeholder="Reference, name, email, phone" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} className={`${sel} w-64`} aria-label="Search" />
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel} aria-label="Booking status">
          <option value="">All statuses</option>{BOOKING.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>
        <select value={f.payment_status} onChange={(e) => setF({ ...f, payment_status: e.target.value })} className={sel} aria-label="Payment status">
          <option value="">All payments</option>{PAYMENT.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !data.items.length ? <div className="p-6"><Empty>No bookings match.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-5 py-3">Reference</th><th>Customer</th><th>Created</th><th>Status</th><th>Payment</th><th className="pr-5 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((b) => (
                <tr key={b.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3"><Link href={`/admin/bookings/${b.id}`} className="font-semibold text-primary underline">{b.booking_reference}</Link></td>
                  <td>{b.customer_name}<br /><span className="text-xs text-muted">{b.customer_email}</span></td>
                  <td>{formatDate(b.created_at)}</td>
                  <td><StatusBadge value={b.booking_status} /></td>
                  <td><StatusBadge value={b.payment_status} /></td>
                  <td className="pr-5 text-right font-semibold text-primary">{money(b.total_amount, b.currency_code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pg?.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40">Previous</button>
          <span>Page {page} of {pg.total_pages} · {pg.total} bookings</span>
          <button disabled={page >= pg.total_pages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}