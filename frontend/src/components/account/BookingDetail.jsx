"use client";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "./State";
import useFetch from "@/hooks/useFetch";
import { money, formatDate, titleCase } from "@/lib/format";
import PayPanel from "./PayPanel";

const snap = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v || {}; } catch { return {}; } };

export default function BookingDetail({ id }) {
  const { data, error, loading, reload } = useFetch(`/customer/bookings/${encodeURIComponent(id)}`);
  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const { booking: b, items, travelers } = data;
  return (
    <Container as="main" className="py-8">
      <Link href="/bookings" className="text-sm text-accent link-underline">← All bookings</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-primary">{b.booking_reference}</h1>
        <div className="flex gap-2"><StatusBadge value={b.booking_status} /><StatusBadge value={b.payment_status} /></div>
      </div>

      <PayPanel booking={b} reload={reload} />

      <section className="mt-8 space-y-3">
        <h2 className="text-xl text-primary">Tour</h2>
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl border border-border bg-white p-5">
            <p className="font-semibold text-primary">{snap(it.tour_snapshot).title || `Tour #${it.tour_id}`}</p>
            <p className="text-sm text-muted">Departs {formatDate(it.starts_at)} · {it.quantity} × {money(it.unit_price, b.currency_code)}</p>
            <p className="mt-1 text-right font-semibold text-primary">{money(it.line_total, b.currency_code)}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-xl text-primary">Travellers</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-white">
          {travelers.map((t) => (
            <li key={t.id} className="flex justify-between px-5 py-3 text-sm"><span>{t.traveler_name}</span><span className="text-muted">{titleCase(t.traveler_type)}{t.nationality ? ` · ${t.nationality}` : ""}</span></li>
          ))}
        </ul>
      </section>

      <section className="mt-8 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(b.subtotal, b.currency_code)}</span></div>
        {Number(b.discount_amount) > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>−{money(b.discount_amount, b.currency_code)}</span></div>}
        {Number(b.tax_amount) > 0 && <div className="flex justify-between"><span>Tax</span><span>{money(b.tax_amount, b.currency_code)}</span></div>}
        <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold text-primary"><span>Total</span><span>{money(b.total_amount, b.currency_code)}</span></div>
      </section>
    </Container>
  );
}