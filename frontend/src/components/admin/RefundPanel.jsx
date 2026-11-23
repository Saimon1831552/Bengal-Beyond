"use client";
import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import RefundActions from "./RefundActions";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDateTime } from "@/lib/format";
import { errMsg } from "@/lib/errors";

function PaymentRefunds({ payment: p, reloadBooking }) {
  const toast = useToast();
  const { data, reload } = useFetch(`/admin/refunds?payment_id=${p.id}&limit=100`);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const items = data?.items || [];
  const committed = items.filter((r) => ["requested", "pending", "succeeded"].includes(r.status)).reduce((s, r) => s + Number(r.amount), 0);
  const refundable = Math.max(0, Math.round((Number(p.amount) - committed) * 100) / 100);
  const refresh = async () => { await Promise.all([reload(), reloadBooking()]); };

  const submitRefund = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/refunds/payments/${p.id}`, { amount: Number(amount).toFixed(2), ...(reason.trim() && { reason: reason.trim() }) });
      toast.success(`Refund of ${money(amount, p.currency_code)} created.`);
      setAmount("");
      setReason("");
      await refresh();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-semibold text-primary">{p.provider} · {p.provider_payment_id} · paid {money(p.amount, p.currency_code)}</p>
      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-border text-sm">
          {items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-2">
              <span>{formatDateTime(r.created_at)} · {r.reason || "No reason"}</span>
              <span className="flex flex-wrap items-start gap-3"><StatusBadge value={r.status} /><strong>{money(r.amount, r.currency_code)}</strong><RefundActions refund={r} provider={p.provider} onDone={refresh} /></span>
            </li>
          ))}
        </ul>
      )}
      {refundable > 0 ? (
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold">Amount (max {refundable})
            <input type="number" required min="0.01" max={refundable} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-32 rounded-xl border border-border px-3 py-2 text-sm" />
          </label>
          <button type="button" onClick={() => setAmount(String(refundable))} className="pb-2 text-xs font-semibold text-primary underline">Full</button>
          <label className="flex-1 text-xs font-semibold">Reason
            <input maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 block w-full min-w-[12rem] rounded-xl border border-border px-3 py-2 text-sm" />
          </label>
          <button disabled={busy} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "…" : "Create refund"}</button>
        </form>
      ) : <p className="mt-3 text-xs text-muted">Fully refunded or committed.</p>}

      <ConfirmModal
        open={confirmOpen}
        tone="danger"
        title="Create refund record?"
        description={`Create a refund of ${money(amount || 0, p.currency_code)} for payment #${p.id}?`}
        confirmLabel="Create refund"
        busy={busy}
        onConfirm={async () => {
          setConfirmOpen(false);
          await submitRefund();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default function RefundPanel({ payments, bookingStatus, reload }) {
  const paid = payments.filter((p) => p.status === "succeeded");
  if (!paid.length) return null;
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-lg text-primary">Refunds</h2>
      {!["cancelled", "rejected", "expired"].includes(bookingStatus) && (
        <p className="mt-1 text-sm text-primary-dark">This booking is still active. Refunds normally follow a cancellation.</p>
      )}
      <div className="mt-3 space-y-4">{paid.map((p) => <PaymentRefunds key={p.id} payment={p} reloadBooking={reload} />)}</div>
    </section>
  );
}