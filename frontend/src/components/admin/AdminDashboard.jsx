"use client";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money, formatDate, titleCase } from "@/lib/format";

const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-border bg-white p-5">
    <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
    <p className="mt-2 font-display text-3xl font-semibold text-primary">{value}</p>
  </div>
);

export default function AdminDashboard() {
  const { data: d, error, loading, reload } = useFetch("/admin/dashboard?months=6");
  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const max = Math.max(1, ...d.bookingTrend.map((m) => m.bookings));
  const s = d.summary;
  return (
    <Container as="main" className="space-y-10 py-8">
      <h1 className="text-3xl text-primary">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Bookings" value={s.totalBookings} />
        <Stat label="Awaiting action" value={s.pendingBookings} />
        <Stat label="Customers" value={s.activeCustomers} />
        <Stat label="Published tours" value={s.publishedTours} />
        <Stat label="Upcoming departures" value={s.upcomingDepartures} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl text-primary">Bookings, last {d.period.months} months</h2>
          <div className="mt-6 flex h-40 items-end gap-3">
            {d.bookingTrend.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-muted">{m.bookings}</span>
                <div className="w-full rounded-t-lg bg-linear-to-t from-primary to-accent" style={{ height: `${(m.bookings / max) * 100}%`, minHeight: 4 }} />
                <span className="text-[10px] text-muted">{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl text-primary">Revenue (verified payments)</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {d.revenueByCurrency.length ? d.revenueByCurrency.map((r) => (
              <li key={r.currencyCode} className="flex justify-between"><span>{r.currencyCode}</span><span className="font-semibold text-primary">{money(r.amount, r.currencyCode)}</span></li>
            )) : <li className="text-muted">No payments yet.</li>}
          </ul>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted">By status</h3>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
            {d.bookingStatuses.map((b) => <li key={b.status} className="flex justify-between pr-4"><span>{titleCase(b.status)}</span><span className="font-semibold">{b.count}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between"><h2 className="text-xl text-primary">Recent bookings</h2><Link href="/admin/bookings" className="text-sm font-semibold text-accent link-underline">All</Link></div>
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-white">
            {d.recentBookings.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm hover:bg-primary/5">
                <span><span className="font-semibold text-primary">{b.booking_reference}</span> · {b.customer_name}</span>
                <span className="flex items-center gap-2"><StatusBadge value={b.booking_status} />{money(b.total_amount, b.currency_code)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl text-primary">Upcoming departures</h2>
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-white">
            {d.upcomingDepartures.length ? d.upcomingDepartures.map((x) => (
              <div key={x.id} className="flex justify-between px-5 py-3 text-sm">
                <span><span className="font-semibold text-primary">{x.tourTitle}</span> · {formatDate(x.startsAt)}</span>
                <span className="text-muted">{x.seatsReserved}/{x.seatCapacity} seats</span>
              </div>
            )) : <p className="px-5 py-3 text-sm text-muted">None scheduled.</p>}
          </div>
        </div>
      </section>
    </Container>
  );
}