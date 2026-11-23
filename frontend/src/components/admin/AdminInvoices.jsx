"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDate } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const PAGE_SIZE = 20;

export default function AdminInvoices() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch(`/admin/invoices${statusFilter ? `?status=${statusFilter}` : ""}`);
  const { data: bookingsData } = useFetch("/admin/bookings?limit=100");
  const bookings = bookingsData?.bookings || bookingsData || [];

  const [form, setForm] = useState({ booking_id: "", due_at: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const rows = data || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/invoices", form);
      setForm({ booking_id: "", due_at: "", notes: "" });
      toast.success("Invoice generated.");
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/invoices/${id}`, { status });
      toast.success(`Invoice marked as ${status}.`);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Invoices</h1>
          <p className="mt-1 text-sm text-muted">Generate and track customer billing invoices tied to bookings.</p>
        </div>
        <select
          aria-label="Filter status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>
      </div>

      <form onSubmit={create} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-4">
        <label className="text-xs font-semibold sm:col-span-2">
          Booking *
          <select required value={form.booking_id} onChange={(e) => setForm({ ...form, booking_id: e.target.value })} className={inp}>
            <option value="">Select booking…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.booking_reference} — {b.customer_name} ({money(b.total_amount, b.currency_code)})
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold">
          Due date
          <input type="date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Notes
          <input placeholder="Bank transfer / corporate note…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} />
        </label>

        <div className="sm:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Generating…" : "Generate invoice"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> : !rows.length ? <div className="p-6"><Empty>No invoices generated yet.</Empty></div> : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th className="pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedRows.map((inv) => (
                  <tr key={inv.id} className="hover:bg-primary/5">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-primary">{inv.invoice_number}</td>
                    <td>
                      <Link href={`/admin/bookings/${inv.booking_id}`} className="font-mono text-xs font-semibold text-primary underline">
                        {inv.booking_reference}
                      </Link>
                    </td>
                    <td>
                      <span className="font-medium text-primary">{inv.customer_name}</span>
                      <span className="block text-xs text-muted">{inv.customer_email}</span>
                    </td>
                    <td className="font-semibold text-primary">{money(inv.total_amount, inv.currency_code)}</td>
                    <td><StatusBadge value={inv.status} /></td>
                    <td>{formatDate(inv.issued_at)}</td>
                    <td className="space-x-2 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                      {inv.status !== "paid" && inv.status !== "void" && (
                        <button onClick={() => updateStatus(inv.id, "paid")} className="text-accent underline">Mark Paid</button>
                      )}
                      {inv.status !== "void" && (
                        <button onClick={() => setVoidTarget(inv)} className="text-terracotta underline">Void</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} totalItems={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(voidTarget)}
        tone="danger"
        title="Void this invoice?"
        description={voidTarget ? `Voiding ${voidTarget.invoice_number} (${money(voidTarget.total_amount, voidTarget.currency_code)}) cannot be undone, though a new invoice can be reissued afterward.` : ""}
        confirmLabel="Void invoice"
        onConfirm={async () => {
          const target = voidTarget;
          setVoidTarget(null);
          if (target) await updateStatus(target.id, "void");
        }}
        onCancel={() => setVoidTarget(null)}
      />
    </Container>
  );
}