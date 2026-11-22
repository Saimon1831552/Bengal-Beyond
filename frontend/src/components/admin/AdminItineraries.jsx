"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = { tour_id: "", day_number: 1, title: "", description: "", meals: "", accommodation_note: "" };

export default function AdminItineraries() {
  const { data: tours } = useFetch("/admin/tours?limit=100");
  const [filterTour, setFilterTour] = useState("");
  const qs = filterTour ? `?tour_id=${filterTour}` : "";
  const { data, error, loading, reload } = useFetch(`/admin/itineraries${qs}`);

  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      tour_id: String(row.tour_id),
      day_number: row.day_number,
      title: row.title,
      description: row.description,
      meals: row.meals || "",
      accommodation_note: row.accommodation_note || "",
    });
  };

  const reset = () => {
    setEditingId(null);
    setForm(BLANK);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const payload = { ...form, tour_id: Number(form.tour_id), day_number: Number(form.day_number) };
      if (editingId) {
        await api.patch(`/admin/itineraries/${editingId}`, payload);
        setMsg({ type: "ok", text: "Itinerary day updated." });
      } else {
        await api.post("/admin/itineraries", payload);
        setMsg({ type: "ok", text: "Itinerary day added." });
      }
      reset();
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete Day ${row.day_number}: "${row.title}"?`)) return;
    try {
      await api.delete(`/admin/itineraries/${row.id}`);
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    }
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Itinerary management</h1>
          <p className="mt-1 text-sm text-muted">Build day-by-day schedules, meals, and overnight stays for each tour.</p>
        </div>
        <select
          aria-label="Filter by tour"
          value={filterTour}
          onChange={(e) => setFilterTour(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All tours</option>
          {(tours || []).map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <h2 className="text-lg text-primary">{editingId ? `Edit itinerary day #${editingId}` : "Add itinerary day"}</h2>
        </div>

        <label className="text-xs font-semibold lg:col-span-2">
          Tour *
          <select required value={form.tour_id} onChange={(e) => setForm({ ...form, tour_id: e.target.value })} className={inp}>
            <option value="">Select tour…</option>
            {(tours || []).map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold">
          Day number *
          <input type="number" min={1} max={60} required value={form.day_number} onChange={(e) => setForm({ ...form, day_number: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Included meals
          <input placeholder="Breakfast, Lunch, Dinner" value={form.meals} onChange={(e) => setForm({ ...form, meals: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-2">
          Day title *
          <input required placeholder="Arrival & Cox's Bazar Sunset Beach Walk" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-2">
          Overnight stay / accommodation note
          <input placeholder="3-star beachside resort in Kolatoli" value={form.accommodation_note} onChange={(e) => setForm({ ...form, accommodation_note: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-2 lg:col-span-4">
          Activities &amp; schedule *
          <textarea rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} />
        </label>

        {msg.text && (
          <p className={`text-sm sm:col-span-2 lg:col-span-4 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update day" : "Add day"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="text-sm font-semibold text-primary underline">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : !data.length ? (
          <Empty>No itinerary days created yet.</Empty>
        ) : (
          data.map((row) => (
            <article key={row.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {row.tour_title} · Day {row.day_number}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-primary">{row.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">{row.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                    {row.meals && <span><strong>Meals:</strong> {row.meals}</span>}
                    {row.accommodation_note && <span><strong>Stay:</strong> {row.accommodation_note}</span>}
                  </div>
                </div>
                <div className="space-x-3 text-xs font-semibold">
                  <button onClick={() => startEdit(row)} className="text-primary underline">Edit</button>
                  <button onClick={() => remove(row)} className="text-terracotta underline">Delete</button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Container>
  );
}