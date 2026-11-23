"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDateTime } from "@/lib/format";
import { errMsg } from "@/lib/errors";

function Row({ r, reload }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // "approve" | "reject"

  const executeDecision = async (action) => {
    setBusy(action);
    try {
      await api.post(`/admin/cancellation-requests/${r.id}/${action}`, note.trim() ? { note: note.trim() } : {});
      toast.success(action === "approve" ? `Booking ${r.booking_reference} cancelled and seats released.` : "Cancellation request rejected.");
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <li className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/admin/bookings/${r.booking_id}`} className="font-semibold text-primary underline">{r.booking_reference}</Link>
          <span className="ml-2 text-sm text-muted">{r.customer_name} · {formatDateTime(r.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={r.booking_status} />
          <StatusBadge value={r.payment_status} />
          <span className="font-semibold text-primary">{money(r.total_amount, r.currency_code)}</span>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-background p-3 text-sm">&ldquo;{r.reason}&rdquo;</p>
      {r.status === "pending" ? (
        <div className="mt-4 space-y-3">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} aria-label="Note"
            placeholder="Note (a rejection note is shown to the customer)" className="w-full rounded-xl border border-border px-4 py-2 text-sm outline-none focus:border-accent" />
          <div className="flex gap-3">
            <button onClick={() => setPendingAction("approve")} disabled={!!busy} className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy === "approve" ? "…" : "Approve & cancel booking"}
            </button>
            <button onClick={() => setPendingAction("reject")} disabled={!!busy} className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-50">
              {busy === "reject" ? "…" : "Reject"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm"><StatusBadge value={r.status} /> <span className="text-muted">{formatDateTime(r.reviewed_at)}</span></p>
      )}

      <ConfirmModal
        open={Boolean(pendingAction)}
        tone={pendingAction === "approve" ? "danger" : "primary"}
        title={pendingAction === "approve" ? `Approve & cancel ${r.booking_reference}?` : "Reject cancellation request?"}
        description={
          pendingAction === "approve"
            ? "Seats will be released immediately. If this booking was paid, create a refund afterwards."
            : "The booking will remain active and the customer will be notified."
        }
        confirmLabel={pendingAction === "approve" ? "Approve & Cancel" : "Reject Request"}
        busy={Boolean(busy)}
        onConfirm={async () => {
          const act = pendingAction;
          setPendingAction(null);
          if (act) await executeDecision(act);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </li>
  );
}

export default function AdminCancellations() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useFetch(`/admin/cancellation-requests?page=${page}&limit=20${status ? `&status=${status}` : ""}`);

  return (
    <Container as="main" className="max-w-4xl py-8">
      <h1 className="text-3xl text-primary">Cancellation requests</h1>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status" className="mt-6 rounded-xl border border-border bg-white px-3 py-2 text-sm">
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="">All</option>
      </select>
      <div className="mt-6">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : !data.length ? <Empty>Nothing here.</Empty> :
          <ul className="space-y-4">{data.map((r) => <Row key={r.id} r={r} reload={reload} />)}</ul>}
      </div>
      {meta?.totalPages > 1 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
          <Pagination page={page} totalPages={meta.totalPages} totalItems={meta.total || data.length} pageSize={20} onPageChange={setPage} />
        </div>
      )}
    </Container>
  );
}