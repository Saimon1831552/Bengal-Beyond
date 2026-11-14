"use client";
import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDateTime, toLocalInput, fromLocalInput } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent";

export default function DepartureManager({ tourId, currency, basePrice }) {
  const { data, error, loading, reload } = useFetch(`/admin/departures?tour_id=${tourId}&limit=100`);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const run = async (name, fn) => {
    setBusy(name); setMsg("");
    try { await fn(); await reload(); return true; }
    catch (e) { setMsg(errMsg(e)); return false; }
    finally { setBusy(""); }
  };

  const newForm = () => setForm({ starts_at: "", ends_at: "", seat_capacity: 20, price_override: "" });
  const editForm = (d) => setForm({ id: d.id, starts_at: toLocalInput(d.starts_at), ends_at: toLocalInput(d.ends_at), seat_capacity: d.seat_capacity, price_override: d.price_override ?? "" });

  const save = async (e) => {
    e.preventDefault();
    const body = { starts_at: fromLocalInput(form.starts_at), seat_capacity: Number(form.seat_capacity) };
    const ok = await run("save", () => {
      if (form.id) {
        body.ends_at = fromLocalInput(form.ends_at);
        body.price_override = form.price_override === "" ? null : Number(form.price_override);
        return api.patch(`/admin/departures/${form.id}`, body);
      }
      body.tour_id = tourId;
      if (form.ends_at) body.ends_at = fromLocalInput(form.ends_at);
      if (form.price_override !== "") body.price_override = Number(form.price_override);
      return api.post("/admin/departures", body);
    });
    if (ok) setForm(null);
  };

  const setStatus = (d, status) => {
    const warn = status === "cancelled"
      ? "Cancel this departure? Customers who already booked are NOT cancelled or refunded automatically."
      : "Mark this departure as completed?";
    if (window.confirm(warn)) run(`${d.id}-${status}`, () => api.patch(`/admin/departures/${d.id}/status`, { status }));
  };
  const remove = (d) => {
    if (window.confirm("Delete this departure? Only possible if it has no bookings.")) run(`${d.id}-del`, () => api.delete(`/admin/departures/${d.id}`));
  };
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section className="rounded-3xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-primary">Departures</h2>
        {!form && <button onClick={newForm} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Add departure</button>}
      </div>
      <p className="mt-1 text-xs text-muted">Times are entered in your browser&apos;s timezone and stored in UTC.</p>

      {form && (
        <form onSubmit={save} className="mt-5 grid gap-4 rounded-2xl border border-gold/50 bg-gold/10 p-5 sm:grid-cols-2">
          <label className="text-sm font-medium">Starts<input type="datetime-local" required className={inp} value={form.starts_at} onChange={f("starts_at")} /></label>
          <label className="text-sm font-medium">Ends<input type="datetime-local" className={inp} value={form.ends_at} onChange={f("ends_at")} /></label>
          <label className="text-sm font-medium">Seat capacity<input type="number" min={1} required className={inp} value={form.seat_capacity} onChange={f("seat_capacity")} /></label>
          <label className="text-sm font-medium">Price override ({currency})<input type="number" min={0} step="0.01" placeholder={`Blank = base price (${basePrice})`} className={inp} value={form.price_override} onChange={f("price_override")} /></label>
          <div className="flex gap-3 sm:col-span-2">
            <button disabled={busy === "save"} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60">{busy === "save" ? "Saving…" : form.id ? "Save departure" : "Add departure"}</button>
            <button type="button" onClick={() => setForm(null)} className="text-sm font-semibold text-primary underline">Cancel</button>
          </div>
        </form>
      )}
      {msg && <p role="alert" className="mt-4 text-sm text-terracotta">{msg}</p>}

      <div className="mt-5 overflow-x-auto">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : !data.length ? <p className="text-sm text-muted">No departures yet. Customers can&apos;t book this tour until you add one.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">Departs</th><th>Ends</th><th>Seats sold</th><th>Price</th><th>Status</th><th /></tr></thead>
            <tbody className="divide-y divide-border">
              {data.map((d) => {
                const live = d.status === "scheduled" || d.status === "sold_out";
                return (
                  <tr key={d.id}>
                    <td className="py-3">{formatDateTime(d.starts_at)}</td>
                    <td>{d.ends_at ? formatDateTime(d.ends_at) : "—"}</td>
                    <td>{d.seats_reserved}/{d.seat_capacity}</td>
                    <td>{d.price_override != null ? money(d.price_override, currency) : <span className="text-muted">base</span>}</td>
                    <td><StatusBadge value={d.status} /></td>
                    <td className="space-x-3 whitespace-nowrap text-right text-xs font-semibold">
                      {live && <button onClick={() => editForm(d)} className="text-primary underline">Edit</button>}
                      {d.status === "scheduled" && <button onClick={() => setStatus(d, "cancelled")} className="text-terracotta underline">Cancel</button>}
                      {d.status === "scheduled" && <button onClick={() => setStatus(d, "completed")} className="text-primary underline">Complete</button>}
                      <button onClick={() => remove(d)} className="text-terracotta underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">&ldquo;Seats sold&rdquo; counts paid bookings. Seats held for unpaid bookings (15 minutes) are subtracted automatically at booking time.</p>
    </section>
  );
}