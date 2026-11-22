"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import { useCan } from "./AdminShell";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUSES = ["initiated", "pending", "succeeded", "failed", "cancelled"];
const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminPayments() {
  const can = useCan();
  const [f, setF] = useState({ status: "", provider: "", booking_id: "", from: "", to: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const qs = new URLSearchParams({ page, limit: 20 });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { data, raw, error, loading, reload } = useFetch(`/admin/payments?${qs}`);
  const pg = raw?.pagination;
  const manage = can("payments.manage");

  const runAction = async (payment, action) => {
    const label = action === "verify" ? "VERIFY (mark as succeeded)" : "MARK FAILED";
    const note = window.prompt(`Optional audit note before you ${label} payment #${payment.id} (${payment.booking_reference || `Booking #${payment.booking_id}`}):`);
    if (note === null) return;
    if (!window.confirm(`Confirm: ${label} for ${money(payment.amount, payment.currency_code)}?`)) return;

    setBusy(`${payment.id}-${action}`);
    setMsg({ type: "", text: "" });
    try {
      const res = await api.post(`/admin/payments/${payment.id}/${action}`, {
        ...(note.trim() && { note: note.trim() }),
      });
      setMsg({ type: "ok", text: res.data?.message || "Payment updated." });
      await reload();
    } catch (e) {
      setMsg({ type: "error", text: errMsg(e) });
    } finally {
      setBusy("");
    }
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Payments</h1>
          <p className="mt-1 text-sm text-muted">Gateway transactions and manual payment reconciliation.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setApplied(f);
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <select
          aria-label="Status"
          value={f.status}
          onChange={(e) => setF({ ...f, status: e.target.value })}
          className={sel}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </select>

        <input
          placeholder="Provider (e.g. sslcommerz)"
          aria-label="Provider"
          value={f.provider}
          onChange={(e) => setF({ ...f, provider: e.target.value })}
          className={`${sel} w-48`}
        />

        <input
          placeholder="Booking ID"
          inputMode="numeric"
          pattern="\d*"
          aria-label="Booking ID"
          value={f.booking_id}
          onChange={(e) => setF({ ...f, booking_id: e.target.value })}
          className={`${sel} w-32`}
        />

        <label className="text-xs font-medium text-muted">
          From
          <input
            type="date"
            value={f.from}
            onChange={(e) => setF({ ...f, from: e.target.value })}
            className={`${sel} ml-2`}
          />
        </label>

        <label className="text-xs font-medium text-muted">
          To
          <input
            type="date"
            value={f.to}
            onChange={(e) => setF({ ...f, to: e.target.value })}
            className={`${sel} ml-2`}
          />
        </label>

        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
        {pg?.total != null && <span className="text-sm text-muted">{pg.total} payments</span>}
      </form>

      {msg.text && (
        <p role={msg.type === "error" ? "alert" : "status"} className={`mt-4 text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !data.length ? (
          <div className="p-6"><Empty>No payments found.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Booking</th>
                <th>Provider</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Amount</th>
                {manage && <th className="pr-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((p) => {
                const actionable = manage && ["initiated", "pending", "failed"].includes(p.status);
                return (
                  <tr key={p.id} className="hover:bg-primary/5">
                    <td className="px-5 py-3">
                      <Link href={`/admin/bookings/${p.booking_id}`} className="font-semibold text-primary underline">
                        {p.booking_reference || `#${p.booking_id}`}
                      </Link>
                      <span className="block text-xs text-muted">Payment #{p.id}</span>
                    </td>
                    <td className="capitalize">{p.provider || "—"}</td>
                    <td className="font-mono text-xs">{p.provider_payment_id || "—"}</td>
                    <td>
                      <StatusBadge value={p.status} />
                      {p.verified_at && <span className="mt-1 block text-[11px] text-muted">Verified {formatDateTime(p.verified_at)}</span>}
                    </td>
                    <td className="whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                    <td className="text-right font-semibold text-primary">{money(p.amount, p.currency_code)}</td>
                    {manage && (
                      <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                        {actionable ? (
                          <>
                            <button
                              disabled={!!busy}
                              onClick={() => runAction(p, "verify")}
                              className="text-primary underline disabled:opacity-40"
                            >
                              {busy === `${p.id}-verify` ? "…" : "Verify"}
                            </button>
                            {p.status !== "failed" && (
                              <button
                                disabled={!!busy}
                                onClick={() => runAction(p, "mark-failed")}
                                className="text-terracotta underline disabled:opacity-40"
                              >
                                {busy === `${p.id}-mark-failed` ? "…" : "Mark failed"}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pg?.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {pg.pages} · {pg.total} payments</span>
          <button
            disabled={page >= pg.pages}
            onClick={() => setPage(page + 1)}
            className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </Container>
  );
}