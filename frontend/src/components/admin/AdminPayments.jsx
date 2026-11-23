"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
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
  const toast = useToast();
  const [f, setF] = useState({ status: "", provider: "", booking_id: "", from: "", to: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState("");
  const [modalTarget, setModalTarget] = useState(null); // { payment, action }
  const [auditNote, setAuditNote] = useState("");

  const qs = new URLSearchParams({ page, limit: 20 });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { data, raw, error, loading, reload } = useFetch(`/admin/payments?${qs}`);
  const pg = raw?.pagination;
  const manage = can("payments.manage");

  const openModal = (payment, action) => {
    setAuditNote("");
    setModalTarget({ payment, action });
  };

  const submitAction = async (e) => {
    e.preventDefault();
    if (!modalTarget) return;
    const { payment, action } = modalTarget;
    setBusy(`${payment.id}-${action}`);
    try {
      const res = await api.post(`/admin/payments/${payment.id}/${action}`, {
        ...(auditNote.trim() && { note: auditNote.trim() }),
      });
      toast.success(res.data?.message || "Payment updated.");
      setModalTarget(null);
      setAuditNote("");
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
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
        <select aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>

        <input placeholder="Provider (e.g. sslcommerz)" aria-label="Provider" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} className={`${sel} w-48`} />
        <input placeholder="Booking ID" inputMode="numeric" pattern="\d*" aria-label="Booking ID" value={f.booking_id} onChange={(e) => setF({ ...f, booking_id: e.target.value })} className={`${sel} w-32`} />

        <label className="text-xs font-medium text-muted">
          From
          <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className={`${sel} ml-2`} />
        </label>

        <label className="text-xs font-medium text-muted">
          To
          <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className={`${sel} ml-2`} />
        </label>

        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
        {pg?.total != null && <span className="text-sm text-muted">{pg.total} payments</span>}
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !data.length ? (
          <div className="p-6"><Empty>No payments found.</Empty></div>
        ) : (
          <>
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
                              <button disabled={!!busy} onClick={() => openModal(p, "verify")} className="text-primary underline disabled:opacity-40">
                                Verify
                              </button>
                              {p.status !== "failed" && (
                                <button disabled={!!busy} onClick={() => openModal(p, "mark-failed")} className="text-terracotta underline disabled:opacity-40">
                                  Mark failed
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
            <Pagination page={page} totalPages={pg?.pages || 1} totalItems={pg?.total || data.length} pageSize={20} onPageChange={setPage} />
          </>
        )}
      </div>

      {modalTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onClick={() => !busy && setModalTarget(null)}
        >
          <form
            onSubmit={submitAction}
            className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-primary">
              {modalTarget.action === "verify" ? "Verify payment as succeeded?" : "Mark payment as failed?"}
            </h3>
            <p className="mt-2 text-sm text-muted">
              Payment #{modalTarget.payment.id} ({modalTarget.payment.booking_reference || `Booking #${modalTarget.payment.booking_id}`}) —{" "}
              <strong className="text-primary">{money(modalTarget.payment.amount, modalTarget.payment.currency_code)}</strong>
            </p>
            <label className="mt-4 block text-xs font-semibold text-primary">
              Optional audit note
              <input
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                maxLength={500}
                placeholder="Bank slip ref, gateway verification note…"
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={!!busy} onClick={() => setModalTarget(null)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-primary">
                Cancel
              </button>
              <button
                disabled={!!busy}
                className={`rounded-full px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
                  modalTarget.action === "verify" ? "btn-gold" : "bg-terracotta"
                }`}
              >
                {busy ? "Working…" : modalTarget.action === "verify" ? "Confirm Verify" : "Mark Failed"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Container>
  );
}