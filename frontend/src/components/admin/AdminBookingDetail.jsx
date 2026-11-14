"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "@/components/account/State";
import { useCan } from "./AdminShell";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDate, formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

// mirrors the transitions enforced in admin-booking.repository.js
const NEXT = {
  pending_review: ["awaiting_payment", "confirmed", "rejected", "cancelled"],
  awaiting_payment: ["confirmed", "rejected", "cancelled", "expired"],
  confirmed: ["completed", "cancelled"],
  cancellation_requested: ["confirmed", "cancelled"],
};
const danger = new Set(["rejected", "cancelled", "expired"]);
const snap = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v || {}; } catch { return {}; } };
const box = "rounded-2xl border border-border bg-white p-5";

export default function AdminBookingDetail({ id }) {
  const can = useCan();
  const { data: b, error, loading, reload } = useFetch(`/admin/bookings/${encodeURIComponent(id)}`);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState("internal");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const manage = can("bookings.manage");
  const run = async (name, fn, ok) => {
    setBusy(name); setMsg({ type: "", text: "" });
    try { await fn(); setMsg({ type: "ok", text: ok }); await reload(); }
    catch (e) { setMsg({ type: "error", text: errMsg(e) }); }
    finally { setBusy(""); }
  };

  const changeStatus = (status) => {
    if (danger.has(status) && !window.confirm(`Mark this booking as "${titleCase(status)}"? This cannot be undone.`)) return;
    run(status, () => api.patch(`/admin/bookings/${b.id}/status`, { status, ...(note.trim() && { note: note.trim() }) }),
      `Status changed to ${titleCase(status)}.`).then(() => setNote(""));
  };
  const addNote = (e) => {
    e.preventDefault();
    run("note", () => api.post(`/admin/bookings/${b.id}/notes`, { note: note.trim(), visibility }), "Note added.").then(() => setNote(""));
  };

  const actions = NEXT[b.booking_status] || [];
  return (
    <Container as="main" className="space-y-6 py-8">
      <Link href="/admin/bookings" className="text-sm text-accent link-underline">← All bookings</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-primary">{b.booking_reference}</h1>
        <div className="flex gap-2"><StatusBadge value={b.booking_status} /><StatusBadge value={b.payment_status} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={box}>
          <h2 className="text-lg text-primary">Customer</h2>
          <p className="mt-2 text-sm">{b.customer_name}<br />{b.customer_email}<br />{b.customer_phone}{b.customer_nationality && <><br />{b.customer_nationality}</>}</p>
          {b.special_requests && <p className="mt-3 rounded-xl bg-gold/15 p-3 text-sm"><strong>Special requests:</strong> {b.special_requests}</p>}
        </section>
        <section className={box}>
          <h2 className="text-lg text-primary">Amounts</h2>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(b.subtotal, b.currency_code)}</span></div>
            {Number(b.discount_amount) > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>−{money(b.discount_amount, b.currency_code)}</span></div>}
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-primary"><span>Total</span><span>{money(b.total_amount, b.currency_code)}</span></div>
          </div>
        </section>
      </div>

      <section className={box}>
        <h2 className="text-lg text-primary">Tour</h2>
        {b.items.map((it) => (
          <p key={it.id} className="mt-2 text-sm"><strong>{snap(it.tour_snapshot).title || it.current_tour_title}</strong> · departs {formatDate(it.starts_at)} · {it.quantity} × {money(it.unit_price, b.currency_code)}</p>
        ))}
        <h3 className="mt-4 text-sm font-semibold uppercase tracking-widest text-muted">Travellers</h3>
        <ul className="mt-1 text-sm">{b.travelers.map((t) => <li key={t.id}>{t.traveler_name} · {titleCase(t.traveler_type)}{t.nationality ? ` · ${t.nationality}` : ""}</li>)}</ul>
      </section>

      <section className={box}>
        <h2 className="text-lg text-primary">Payments</h2>
        {b.payments.length ? (
          <ul className="mt-2 divide-y divide-border text-sm">
            {b.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{p.provider} · {p.provider_payment_id || "—"} · {formatDateTime(p.created_at)}</span>
                <span className="flex items-center gap-2"><StatusBadge value={p.status} />{money(p.amount, p.currency_code)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">No payment attempts.</p>}
      </section>

      {manage && (
        <section className="rounded-3xl border border-gold/50 bg-gold/10 p-6">
          <h2 className="text-lg text-primary">Actions</h2>
          {b.booking_status === "pending_review" && b.payment_status === "paid" && (
            <p className="mt-2 text-sm text-primary-dark">This booking is paid and waiting for your decision.</p>
          )}
          <form onSubmit={addNote} className="mt-4 space-y-3">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} placeholder="Note (attached to a status change, or saved on its own)"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-accent" />
            <div className="flex flex-wrap items-center gap-3">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm" aria-label="Note visibility">
                <option value="internal">Internal</option><option value="customer_visible">Customer visible</option>
              </select>
              <button disabled={!note.trim() || busy === "note"} className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-40">Save note only</button>
            </div>
          </form>
          {actions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {actions.map((s) => (
                <button key={s} onClick={() => changeStatus(s)} disabled={!!busy}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${danger.has(s) ? "border border-terracotta text-terracotta" : s === "confirmed" ? "btn-gold" : "bg-primary text-white"}`}>
                  {busy === s ? "…" : s === "confirmed" ? "Confirm booking" : titleCase(s)}
                </button>
              ))}
            </div>
          )}
          {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`mt-4 text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={box}>
          <h2 className="text-lg text-primary">Status history</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {b.status_history.map((h) => (
              <li key={h.id}><span className="text-muted">{formatDateTime(h.created_at)}</span> · {h.previous_status ? `${titleCase(h.previous_status)} → ` : ""}<strong>{titleCase(h.new_status)}</strong>{h.note && <span className="block text-muted">“{h.note}”</span>}</li>
            ))}
          </ul>
        </section>
        <section className={box}>
          <h2 className="text-lg text-primary">Notes</h2>
          {b.notes.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {b.notes.map((n) => <li key={n.id}><span className="text-muted">{formatDateTime(n.created_at)} · {n.visibility === "internal" ? "Internal" : "Customer visible"}</span><br />{n.note}</li>)}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">No notes.</p>}
        </section>
      </div>
    </Container>
  );
}