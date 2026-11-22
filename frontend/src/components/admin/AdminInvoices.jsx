"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDate } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminInvoices() {
  const { data: bookings } = useFetch("/admin/bookings?limit=100");
  const { data, error, loading, reload } = useFetch("/admin/invoices");
  const [form, setForm] = useState({ booking_id: "", due_at: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [preview, setPreview] = useState(null);

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/admin/invoices", {
        booking_id: Number(form.booking_id),
        due_at: form.due_at || null,
        notes: form.notes || null,
      });
      setForm({ booking_id: "", due_at: "", notes: "" });
      setMsg({ type: "ok", text: "Invoice generated." });
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (inv, status) => {
    await api.patch(`/admin/invoices/${inv.id}`, { status });
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Invoices</h1>
      <p className="mt-1 text-sm text-muted">Generate itemized customer invoices from bookings and print or save as PDF.</p>

      <form onSubmit={generate} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        <label className="text-xs font-semibold">
          Booking *
          <select required value={form.booking_id} onChange={(e) => setForm({ ...form, booking_id: e.target.value })} className={inp}>
            <option value="">Select booking…</option>
            {(bookings || []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.booking_reference} — {b.customer_name} ({money(b.total_amount, b.currency_code)})
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold">
          Due date (optional)
          <input type="date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Invoice note
          <input placeholder="Bank transfer / SSLCommerz reference" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} />
        </label>

        {msg.text && (
          <p className={`text-sm sm:col-span-3 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>
            {msg.text}
          </p>
        )}

        <div className="sm:col-span-3">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Generating…" : "Generate invoice"}
          </button>
        </div>
      </form>

      {/* Printable Invoice Preview Card */}
      {preview && (
        <section className="mt-6 rounded-2xl border-2 border-primary bg-white p-8 print:border-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Bengal Beyond</p>
              <h2 className="mt-1 text-2xl text-primary">Invoice {preview.invoice_number}</h2>
              <p className="mt-1 text-xs text-muted">Issued: {formatDate(preview.issued_at)}{preview.due_at ? ` · Due: ${formatDate(preview.due_at)}` : ""}</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button type="button" onClick={() => window.print()} className="btn-gold rounded-full px-5 py-2 text-xs font-semibold">
                Print / Save PDF
              </button>
              <button type="button" onClick={() => setPreview(null)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold">
                Close
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-muted">Billed To</p>
              <p className="mt-1 font-semibold text-primary">{preview.customer_name}</p>
              <p className="text-muted">{preview.customer_email}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase text-muted">Booking Reference</p>
              <p className="mt-1 font-mono font-semibold text-primary">{preview.booking_reference}</p>
              <div className="mt-1"><StatusBadge value={preview.status} /></div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 text-sm">
            <div className="flex justify-between py-1"><span>Subtotal</span><span>{money(preview.subtotal, preview.currency_code)}</span></div>
            {Number(preview.discount_amount) > 0 && (
              <div className="flex justify-between py-1 text-accent"><span>Discount</span><span>−{money(preview.discount_amount, preview.currency_code)}</span></div>
            )}
            {Number(preview.tax_amount) > 0 && (
              <div className="flex justify-between py-1"><span>Tax</span><span>{money(preview.tax_amount, preview.currency_code)}</span></div>
            )}
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold text-primary">
              <span>Total Due</span>
              <span>{money(preview.total_amount, preview.currency_code)}</span>
            </div>
            {preview.notes && <p className="mt-4 text-xs text-muted">Note: {preview.notes}</p>}
          </div>
        </section>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !data.length ? (
          <div className="p-6"><Empty>No invoices generated yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th>Booking</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Issued</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((inv) => (
                <tr key={inv.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{inv.invoice_number}</td>
                  <td>
                    <Link href={`/admin/bookings/${inv.booking_id}`} className="font-mono text-xs text-primary underline">
                      {inv.booking_reference}
                    </Link>
                  </td>
                  <td>
                    <span className="font-medium text-primary">{inv.customer_name}</span>
                    <span className="block text-xs text-muted">{inv.customer_email}</span>
                  </td>
                  <td className="font-semibold">{money(inv.total_amount, inv.currency_code)}</td>
                  <td className="whitespace-nowrap">{formatDate(inv.issued_at)}</td>
                  <td><StatusBadge value={inv.status} /></td>
                  <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                    <button onClick={() => setPreview(inv)} className="text-primary underline">View / Print</button>
                    {inv.status !== "paid" && inv.status !== "void" && (
                      <button onClick={() => setStatus(inv, "paid")} className="text-accent underline">Mark Paid</button>
                    )}
                    {inv.status !== "void" && (
                      <button onClick={() => setStatus(inv, "void")} className="text-terracotta underline">Void</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
}