"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = { category: "General", question: "", answer: "", sort_order: 0, status: "published" };

export default function AdminFaqs() {
  const { data, error, loading, reload } = useFetch("/admin/faqs");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ category: r.category, question: r.question, answer: r.answer, sort_order: r.sort_order, status: r.status });
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
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (editingId) {
        await api.patch(`/admin/faqs/${editingId}`, payload);
        setMsg({ type: "ok", text: "FAQ updated." });
      } else {
        await api.post("/admin/faqs", payload);
        setMsg({ type: "ok", text: "FAQ created." });
      }
      reset();
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete FAQ "${r.question}"?`)) return;
    await api.delete(`/admin/faqs/${r.id}`);
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">FAQs</h1>
      <p className="mt-1 text-sm text-muted">Manage frequently asked questions grouped by category and display order.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        <label className="text-xs font-semibold">
          Category
          <input placeholder="Booking, Payments, Visas…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Sort order
          <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>

        <label className="text-xs font-semibold sm:col-span-3">
          Question *
          <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-3">
          Answer *
          <textarea rows={3} required value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className={inp} />
        </label>

        {msg.text && <p className={`text-sm sm:col-span-3 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}

        <div className="flex gap-3 sm:col-span-3">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update FAQ" : "Add FAQ"}
          </button>
          {editingId && <button type="button" onClick={reset} className="text-sm font-semibold text-primary underline">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : !data.length ? <Empty>No FAQs created yet.</Empty> : data.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{r.category}</span>
                  <StatusBadge value={r.status} />
                </div>
                <h2 className="mt-2 font-semibold text-primary">{r.question}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.answer}</p>
              </div>
              <div className="space-x-3 text-xs font-semibold">
                <button onClick={() => startEdit(r)} className="text-primary underline">Edit</button>
                <button onClick={() => remove(r)} className="text-terracotta underline">Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}