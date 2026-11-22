"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money } from "@/lib/format";

const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminReports() {
  const [f, setF] = useState({ from: "", to: "" });
  const [applied, setApplied] = useState(f);

  const qs = new URLSearchParams();
  if (applied.from) qs.set("from", applied.from);
  if (applied.to) qs.set("to", applied.to);
  const query = qs.toString();

  const { data, error, loading, reload } = useFetch(`/admin/reports${query ? `?${query}` : ""}`);

  if (loading) return <Container as="main" className="py-8"><Loading /></Container>;
  if (error) return <Container as="main" className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const { kpis, monthly = [], byTour = [] } = data || {};
  const maxMonthly = Math.max(1, ...monthly.map((m) => Number(m.revenue || 0)));

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Revenue &amp; performance reports</h1>
          <p className="mt-1 text-sm text-muted">Financial summary, monthly revenue trend, and top-earning tours.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(f);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="date" aria-label="From date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className={sel} />
          <span className="text-xs text-muted">to</span>
          <input type="date" aria-label="To date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className={sel} />
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">Apply</button>
        </form>
      </div>

      {/* KPI Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Gross Revenue</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">{money(kpis.gross_revenue, "BDT")}</p>
          <p className="mt-1 text-xs text-muted">{kpis.payment_count} successful payments</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Refunds Issued</p>
          <p className="mt-2 font-display text-2xl font-bold text-terracotta">{money(kpis.total_refunds, "BDT")}</p>
          <p className="mt-1 text-xs text-muted">{kpis.refund_count} processed refunds</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Net Revenue</p>
          <p className="mt-2 font-display text-2xl font-bold text-accent">{money(kpis.net_revenue, "BDT")}</p>
          <p className="mt-1 text-xs text-muted">Avg order: {money(kpis.avg_order_value, "BDT")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Bookings Breakdown</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">{kpis.confirmed_bookings} / {kpis.total_bookings}</p>
          <p className="mt-1 text-xs text-muted">Confirmed / Total ({kpis.cancelled_bookings} cancelled)</p>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <section className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-xl text-primary">Monthly collected revenue</h2>
        {!monthly.length ? (
          <p className="mt-3 text-sm text-muted">No settled payment data yet.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {monthly.map((m) => {
              const pct = Math.max(4, Math.round((Number(m.revenue) / maxMonthly) * 100));
              return (
                <div key={m.month} className="grid grid-cols-[5.5rem_1fr_9rem] items-center gap-3 text-sm">
                  <span className="font-mono text-xs font-semibold text-primary">{m.month}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-right font-semibold text-primary">{money(m.revenue, "BDT")}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Revenue by Tour */}
      <section className="mt-8 overflow-x-auto rounded-2xl border border-border bg-white">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xl text-primary">Bookings &amp; revenue by tour</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-6 py-3">Tour</th>
              <th>Active Bookings</th>
              <th>Travelers</th>
              <th className="pr-6 text-right">Booked Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {byTour.map((t) => (
              <tr key={t.tour_id} className="hover:bg-primary/5">
                <td className="px-6 py-3">
                  <Link href={`/admin/tours/${t.tour_id}`} className="font-semibold text-primary underline">
                    {t.tour_title}
                  </Link>
                </td>
                <td>{t.bookings_count}</td>
                <td>{t.travelers_count} pax</td>
                <td className="pr-6 text-right font-semibold text-primary">{money(t.booked_value, "BDT")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Container>
  );
}