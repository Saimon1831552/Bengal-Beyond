"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "./State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDate, formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";
import PayPanel from "./PayPanel";
import CancelRequest from "./CancelRequest";
import ReviewPrompt from "./ReviewPrompt";

const snap = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v || {}; } catch { return {}; } };

export default function BookingDetail({ id }) {
  const { data, error, loading, reload } = useFetch(`/customer/bookings/${encodeURIComponent(id)}`);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const { booking: b, items, travelers, change_requests, notes } = data;

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    setReplyError("");
    try {
      await api.post(`/customer/bookings/${b.id}/messages`, { message: reply.trim() });
      setReply("");
      await reload();
    } catch (err) {
      setReplyError(errMsg(err));
    } finally {
      setSending(false);
    }
  };

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
        {Number(b.paid_amount) > 0 && (
          <div className="flex justify-between text-primary"><span>Paid</span><span>{money(b.paid_amount, b.currency_code)}</span></div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-border bg-white p-6">
        <h2 className="text-xl text-primary">Tour Conversation</h2>
        <p className="mt-1 text-xs text-muted">Message our team directly about this tour booking inside your account.</p>

        <div className="mt-4 space-y-3">
          {notes.length === 0 ? (
            <p className="rounded-2xl bg-background/60 p-4 text-sm text-muted">No messages yet. Ask a question about your itinerary, pickup, or payment below.</p>
          ) : (
            notes.map((n) => {
              const isCustomer = n.sender_type === "customer";
              return (
                <div
                  key={n.id}
                  className={`max-w-xl rounded-2xl p-4 text-sm ${
                    isCustomer ? "ml-auto bg-primary text-white" : "border border-border bg-background/70 text-primary"
                  }`}
                >
                  <div className={`flex items-center justify-between gap-4 text-xs ${isCustomer ? "text-white/80" : "text-muted"}`}>
                    <span className="font-semibold">{isCustomer ? "You" : (n.sender_name || "Bengal Beyond Team")}</span>
                    <span>{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap">{n.note}</p>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={sendReply} className="mt-4 space-y-2 border-t border-border pt-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="Write a message to our team about this booking…"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {replyError && <p role="alert" className="text-xs text-terracotta">{replyError}</p>}
          <div className="flex justify-end">
            <button
              disabled={!reply.trim() || sending}
              className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>
      </section>

      <CancelRequest booking={b} requests={change_requests} reload={reload} />
      <ReviewPrompt booking={b} items={items} />
    </Container>
  );
}