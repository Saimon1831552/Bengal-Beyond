"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = { author_name: "", author_location: "", tour_title: "", rating: 5, quote: "", is_featured: true, status: "published" };

export default function AdminTestimonials() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch("/admin/testimonials");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      author_name: r.author_name,
      author_location: r.author_location || "",
      tour_title: r.tour_title || "",
      rating: r.rating,
      quote: r.quote,
      is_featured: Boolean(r.is_featured),
      status: r.status,
    });
  };

  const reset = () => {
    setEditingId(null);
    setForm(BLANK);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, rating: Number(form.rating), is_featured: form.is_featured ? 1 : 0 };
      if (editingId) {
        await api.patch(`/admin/testimonials/${editingId}`, payload);
        toast.success("Testimonial updated.");
      } else {
        await api.post("/admin/testimonials", payload);
        toast.success("Testimonial published.");
      }
      reset();
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/testimonials/${deleteTarget.id}`);
      toast.success(`Deleted testimonial from "${deleteTarget.author_name}".`);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Testimonials</h1>
      <p className="mt-1 text-sm text-muted">Curate featured traveler stories and quotes displayed on the homepage.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold">
          Traveler name *
          <input required value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Location
          <input placeholder="London, UK" value={form.author_location} onChange={(e) => setForm({ ...form, author_location: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Tour taken
          <input placeholder="Sundarbans Wildlife Adventure" value={form.tour_title} onChange={(e) => setForm({ ...form, tour_title: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Rating (1–5)
          <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-2 lg:col-span-4">
          Quote *
          <textarea rows={3} required value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className={inp} />
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
          Featured on homepage
        </label>

        <label className="text-xs font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>

        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update testimonial" : "Add testimonial"}
          </button>
          {editingId && <button type="button" onClick={reset} className="text-sm font-semibold text-primary underline">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : !data.length ? <Empty>No testimonials yet.</Empty> : data.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-primary">{r.author_name}</span>
                  {r.author_location && <span className="text-xs text-muted">· {r.author_location}</span>}
                  <span className="text-xs font-bold text-gold">{"★".repeat(r.rating)}</span>
                  {r.is_featured ? <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">Featured</span> : null}
                  <StatusBadge value={r.status} />
                </div>
                <p className="mt-2 text-sm italic text-primary">“{r.quote}”</p>
                {r.tour_title && <p className="mt-1 text-xs text-muted">Tour: {r.tour_title}</p>}
              </div>
              <div className="space-x-3 text-xs font-semibold">
                <button onClick={() => startEdit(r)} className="text-primary underline">Edit</button>
                <button onClick={() => setDeleteTarget(r)} className="text-terracotta underline">Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        tone="danger"
        title="Delete testimonial?"
        description={deleteTarget ? `Remove the testimonial from "${deleteTarget.author_name}"?` : ""}
        confirmLabel="Delete testimonial"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}