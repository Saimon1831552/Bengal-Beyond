"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDateTime, titleCase, toLocalInput, fromLocalInput } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUSES = ["scheduled", "sold_out", "cancelled", "completed"];
const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminAvailability() {
  const { data: tours } = useFetch("/admin/tours?limit=100");
  const [f, setF] = useState({ tour_id: "", status: "", from: "", to: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const qs = new URLSearchParams({ page, limit: 25 });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { data, meta, error, loading, reload } = useFetch(`/admin/departures?${qs}`);

  const openEdit = (d) =>
    setEditing({
      id: d.id,
      tour_title: d.tour_title,
      starts_at: toLocalInput(d.starts_at),
      ends_at: toLocalInput(d.ends_at),
      seat_capacity: d.seat_capacity,
      price_override: d.price_override ?? "",
    });

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy("save");
    setMsg({ type: "", text: "" });
    try {
      await api.patch(`/admin/departures/${editing.id}`, {
        starts_at: fromLocalInput(editing.starts_at),
        ends_at: editing.ends_at ? fromLocalInput(editing.ends_at) : null,
        seat_capacity: Number(editing.seat_capacity),
        price_override: editing.price_override === "" ? null : Number(editing.price_override),
      });
      setEditing(null);
      setMsg({ type: "ok", text: "Departure updated." });
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy("");
    }
  };

  const changeStatus = async (d, status) => {
    const warn = status === "cancelled"
      ? `Cancel departure for "${d.tour_title}"? Existing bookings must be handled separately.`
      : `Mark this departure as completed?`;
    if (!window.confirm(warn)) return;
    setBusy(`${d.id}-${status}`);
    setMsg({ type: "", text: "" });
    try {
      await api.patch(`/admin/departures/${d.id}/status`, { status });
      setMsg({ type: "ok", text: `Marked as ${status}.` });
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy("");
    }
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Tour availability</h1>
          <p className="mt-1 text-sm text-muted">Global departure schedule, seat capacity, and pricing overrides across all tours.</p>
        </div>
        <Link href="/admin/tours" className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary">
          Manage tours
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setApplied(f);
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <select aria-label="Tour" value={f.tour_id} onChange={(e) => setF({ ...f, tour_id: e.target.value })} className={`${sel} max-w-xs`}>
          <option value="">All tours</option>
          {(tours || []).map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>

        <select aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </select>

        <label className="text-xs font-medium text-muted">
          From
          <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className={`${sel} ml-2`} />
        </label>

        <label className="text-xs font-medium text-muted">
          To
          <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className={`${sel} ml-2`} />
        </label>

        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
        {meta?.total != null && <span className="text-sm text-muted">{meta.total} departures</span>}
      </form>

      {editing && (
        <form onSubmit={saveEdit} className="mt-6 grid gap-4 rounded-2xl border border-gold/50 bg-gold/10 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className="text-base font-semibold text-primary">Editing departure #{editing.id} — {editing.tour_title}</h2>
          </div>
          <label className="text-xs font-semibold">
            Starts (local)
            <input type="datetime-local" required value={editing.starts_at} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} className={`mt-1 w-full ${sel}`} />
          </label>
          <label className="text-xs font-semibold">
            Ends (local)
            <input type="datetime-local" value={editing.ends_at} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} className={`mt-1 w-full ${sel}`} />
          </label>
          <label className="text-xs font-semibold">
            Seat capacity
            <input type="number" min={1} required value={editing.seat_capacity} onChange={(e) => setEditing({ ...editing, seat_capacity: e.target.value })} className={`mt-1 w-full ${sel}`} />
          </label>
          <label className="text-xs font-semibold">
            Price override
            <input type="number" min={0} step="0.01" placeholder="Blank = base price" value={editing.price_override} onChange={(e) => setEditing({ ...editing, price_override: e.target.value })} className={`mt-1 w-full ${sel}`} />
          </label>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
            <button disabled={busy === "save"} className="btn-gold rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-50">
              {busy === "save" ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-semibold text-primary underline">Cancel</button>
          </div>
        </form>
      )}

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
          <div className="p-6"><Empty>No departures match your filters.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Tour</th>
                <th>Departs</th>
                <th>Occupancy</th>
                <th>Available</th>
                <th>Price Override</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((d) => {
                const live = d.status === "scheduled" || d.status === "sold_out";
                const pct = d.seat_capacity > 0 ? Math.min(100, Math.round((d.seats_reserved / d.seat_capacity) * 100)) : 0;
                return (
                  <tr key={d.id} className="hover:bg-primary/5">
                    <td className="px-5 py-3">
                      <Link href={`/admin/tours/${d.tour_id}`} className="font-semibold text-primary underline">
                        {d.tour_title}
                      </Link>
                      <span className="block text-xs text-muted">Departure #{d.id}</span>
                    </td>
                    <td className="whitespace-nowrap">{formatDateTime(d.starts_at)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{d.seats_reserved}/{d.seat_capacity}</span>
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-border">
                          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold text-primary">{d.seats_available}</td>
                    <td>{d.price_override != null ? money(d.price_override, "BDT") : <span className="text-muted">Base price</span>}</td>
                    <td><StatusBadge value={d.status} /></td>
                    <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                      {live && <button onClick={() => openEdit(d)} className="text-primary underline">Edit</button>}
                      {d.status === "scheduled" && (
                        <>
                          <button disabled={!!busy} onClick={() => changeStatus(d, "completed")} className="text-primary underline disabled:opacity-40">Complete</button>
                          <button disabled={!!busy} onClick={() => changeStatus(d, "cancelled")} className="text-terracotta underline disabled:opacity-40">Cancel</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {meta?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}