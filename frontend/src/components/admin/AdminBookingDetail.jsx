"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox } from "@/components/account/State";
import { useCan } from "./AdminShell";
import RefundPanel from "./RefundPanel";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDate, formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

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
  const toast = useToast();
  const { data: b, error, loading, reload } = useFetch(`/admin/bookings/${encodeURIComponent(id)}`);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState("customer_visible");
  const [busy, setBusy] = useState("");
  const [confirmStatus, setConfirmStatus] = useState(null);

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const manage = can("bookings.manage");
  const run = async (name, fn, ok) => {
    setBusy(name);
    try {
      await fn();
      toast.success(ok);
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  const applyStatus = async (status) => {
    await run(
      status,
      () => api.patch(`/admin/bookings/${b.id}/status`, { status, ...(note.trim() && { note: note.trim() }) }),
      `Status changed to ${titleCase(status)}.`
    );
    setNote("");
  };

  const changeStatus = (status) => {
    if (danger.has(status)) {
      setConfirmStatus(status);
      return;
    }
    applyStatus(status);
  };

  const sendNote = (sendEmail = false) => {
    if (!note.trim() || busy) return;
    const effectiveVisibility = sendEmail ? "customer_visible" : visibility;
    run(
      sendEmail ? "note-email" : "note",
      () =>
        api.post(`/admin/bookings/${b.id}/notes`, {
          note: note.trim(),
          visibility: effectiveVisibility,
          send_email: sendEmail,
        }),
      sendEmail
        ? "Message sent to customer's email and saved in-app."
        : effectiveVisibility === "customer_visible"
          ? "Message sent in-app to customer."
          : "Internal note added."
    ).then(() => setNote(""));
  };

  const addNote = (e) => {
    e.preventDefault();
    sendNote(false);
  };

  const actions = NEXT[b.booking_status] || [];
  const totalAmount = Number(b.total_amount || 0);
  const paidAmount = Number(b.paid_amount || 0);
  const remainingAmount = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));

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
            {paidAmount > 0 && (
              <>
                <div className="flex justify-between text-primary"><span>Paid</span><span>{money(paidAmount, b.currency_code)}</span></div>
                {remainingAmount > 0 && (
                  <div className="flex justify-between font-medium text-terracotta"><span>Remaining due</span><span>{money(remainingAmount, b.currency_code)}</span></div>
                )}
              </>
            )}
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

      {can("refunds.manage") && <RefundPanel payments={b.payments} bookingStatus={b.booking_status} reload={reload} />}

      {manage && (
        <section className="rounded-3xl border border-gold/50 bg-gold/10 p-6">
          <h2 className="text-lg text-primary">Actions &amp; In-App Message</h2>
          {b.booking_status !== "confirmed" && !["paid", "not_required"].includes(b.payment_status) && (
            <p className="mt-2 text-xs text-muted">
              Payment status is <strong>{titleCase(b.payment_status)}</strong> (Paid: {money(paidAmount, b.currency_code)} / {money(totalAmount, b.currency_code)}). Super Admin can confirm this booking without prior payment.
            </p>
          )}
          <form onSubmit={addNote} className="mt-4 space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={visibility === "customer_visible" ? "Write a message to customer (send in-app or via email)…" : "Internal staff note (hidden from customer)…"}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm" aria-label="Message visibility">
                <option value="customer_visible">Customer visible (In-app chat)</option>
                <option value="internal">Internal note only</option>
              </select>
              <button
                type="submit"
                disabled={!note.trim() || Boolean(busy)}
                className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-40"
              >
                {busy === "note" ? "Saving…" : visibility === "customer_visible" ? "Send in-app message" : "Save internal note"}
              </button>
              <button
                type="button"
                onClick={() => sendNote(true)}
                disabled={!note.trim() || Boolean(busy)}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {busy === "note-email" ? "Sending email…" : "Send message in email"}
              </button>
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
          <h2 className="text-lg text-primary">Tour Conversation &amp; Notes</h2>
          <p className="mt-1 text-xs text-muted">Customer-visible messages appear inside the customer&apos;s booking page.</p>
          {b.notes.length ? (
            <div className="mt-3 space-y-3">
              {b.notes.map((n) => {
                const isCustomer = n.sender_type === "customer";
                return (
                  <div
                    key={n.id}
                    className={`rounded-2xl p-3.5 text-sm ${
                      isCustomer
                        ? "border border-accent/40 bg-accent/10"
                        : n.visibility === "internal"
                          ? "border border-border bg-background/70"
                          : "border border-primary/20 bg-primary/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span className="font-semibold text-primary">
                        {isCustomer ? `Customer (${n.sender_name || b.customer_name})` : (n.sender_name || "Admin")}
                      </span>
                      <span>
                        {formatDateTime(n.created_at)} ·{" "}
                        {isCustomer ? "Customer message" : n.visibility === "internal" ? "Internal note" : "Customer visible"}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-primary">{n.note}</p>
                  </div>
                );
              })}
            </div>
          ) : <p className="mt-2 text-sm text-muted">No messages or notes yet.</p>}
        </section>
      </div>

      <ConfirmModal
        open={Boolean(confirmStatus)}
        tone="danger"
        title={`Mark booking as "${confirmStatus ? titleCase(confirmStatus) : ""}"?`}
        description="This releases any reserved seats and cannot be undone. If the customer already paid, create a refund afterwards."
        confirmLabel={confirmStatus ? titleCase(confirmStatus) : "Confirm"}
        busy={Boolean(busy)}
        onConfirm={async () => {
          const st = confirmStatus;
          setConfirmStatus(null);
          if (st) await applyStatus(st);
        }}
        onCancel={() => setConfirmStatus(null)}
      />
    </Container>
  );
}