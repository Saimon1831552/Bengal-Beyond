"use client";
import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import api from "@/lib/axios";
import { formatDate } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const parse = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v || {}; } catch { return {}; } };
const CANCELLABLE = ["pending_review", "awaiting_payment", "confirmed"];

export default function CancelRequest({ booking: b, requests = [], reload }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pending = requests.find((r) => r.status === "pending");
  const canRequest = CANCELLABLE.includes(b.booking_status) && !pending;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.post(`/customer/bookings/${b.id}/cancellation-request`, { reason: reason.trim() });
      setOpen(false); setReason(""); await reload();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (!canRequest && !requests.length) return null;
  return (
    <section className="mt-8 rounded-2xl border border-border bg-white p-5">
      <h2 className="text-xl text-primary">Cancellation</h2>
      {requests.map((r) => (
        <div key={r.id} className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <StatusBadge value={r.status} />
          <span className="text-muted">Requested {formatDate(r.created_at)}: &ldquo;{parse(r.request_details).reason}&rdquo;</span>
        </div>
      ))}
      {pending && <p className="mt-3 text-sm text-muted">We&apos;re reviewing your request. Any refund follows the tour&apos;s cancellation policy.</p>}
      {canRequest && !open && (
        <button onClick={() => setOpen(true)} className="mt-4 text-sm font-semibold text-terracotta underline">Request cancellation</button>
      )}
      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea required maxLength={2000} rows={4} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Why do you want to cancel?" aria-label="Reason"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent" />
          {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
          <div className="flex gap-3">
            <button disabled={busy || !reason.trim()} className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Send request"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-primary underline">Keep my booking</button>
          </div>
        </form>
      )}
    </section>
  );
}