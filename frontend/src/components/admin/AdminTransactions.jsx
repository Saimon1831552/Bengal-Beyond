"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money, formatDateTime, titleCase } from "@/lib/format";

const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";
const PAGE_SIZE = 20;

export default function AdminTransactions() {
  const toast = useToast();
  const [f, setF] = useState({ type: "", status: "", q: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const query = qs.toString();
  const { data, error, loading, reload } = useFetch(`/admin/transactions${query ? `?${query}` : ""}`);

  useEffect(() => {
    setPage(1);
  }, [applied]);

  const rows = data || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    if (!rows.length) return;
    const headers = ["Type", "ID", "Booking", "Customer", "Provider", "Gateway Ref", "Amount", "Currency", "Status", "Occurred At"];
    const lines = rows.map((r) =>
      [
        r.entry_type,
        r.entry_id,
        r.booking_reference,
        `"${String(r.customer_name || "").replace(/"/g, '""')}"`,
        r.provider,
        r.reference_id || "",
        r.entry_type === "refund" ? -Number(r.amount) : Number(r.amount),
        r.currency_code,
        r.status,
        r.occurred_at,
      ].join(",")
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bengal-beyond-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} transactions to CSV.`);
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Transactions ledger</h1>
          <p className="mt-1 text-sm text-muted">Unified chronological audit of incoming payments and issued refunds.</p>
        </div>
        <button
          type="button"
          disabled={!rows.length}
          onClick={exportCsv}
          className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(f);
        }}
        className="mt-6 flex flex-wrap gap-3"
      >
        <input
          placeholder="Booking ref, customer, gateway ID…"
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.target.value })}
          className={`${sel} min-w-[15rem]`}
        />
        <select aria-label="Entry type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={sel}>
          <option value="">All types</option>
          <option value="payment">Payments (+)</option>
          <option value="refund">Refunds (-)</option>
        </select>
        <select aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel}>
          <option value="">All statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="initiated">Initiated</option>
          <option value="requested">Requested</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !rows.length ? (
          <div className="p-6"><Empty>No transactions found.</Empty></div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Provider / Ref</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="pr-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedRows.map((r) => {
                  const isRefund = r.entry_type === "refund";
                  return (
                    <tr key={`${r.entry_type}-${r.entry_id}`} className="hover:bg-primary/5">
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isRefund ? "bg-terracotta/15 text-terracotta" : "bg-accent/15 text-primary"
                          }`}
                        >
                          {titleCase(r.entry_type)} #{r.entry_id}
                        </span>
                      </td>
                      <td>
                        <Link href={`/admin/bookings/${r.booking_id}`} className="font-mono text-xs font-semibold text-primary underline">
                          {r.booking_reference}
                        </Link>
                      </td>
                      <td>
                        <span className="font-medium text-primary">{r.customer_name}</span>
                        <span className="block text-xs text-muted">{r.customer_email}</span>
                      </td>
                      <td>
                        <span>{titleCase(r.provider)}</span>
                        {r.reference_id && <span className="block font-mono text-xs text-muted">{r.reference_id}</span>}
                      </td>
                      <td className={`font-semibold ${isRefund ? "text-terracotta" : "text-primary"}`}>
                        {isRefund ? "−" : "+"}{money(r.amount, r.currency_code)}
                      </td>
                      <td><StatusBadge value={r.status} /></td>
                      <td className="whitespace-nowrap pr-5">{formatDateTime(r.occurred_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={rows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </Container>
  );
}