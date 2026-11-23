"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = { title: "", slug: "", body: "", seo_title: "", seo_description: "", status: "published" };

export default function AdminPages() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch("/admin/pages");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      body: p.body,
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      status: p.status,
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
      if (editingId) {
        await api.patch(`/admin/pages/${editingId}`, form);
        toast.success("Page updated.");
      } else {
        await api.post("/admin/pages", form);
        toast.success("Page created.");
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
      await api.delete(`/admin/pages/${deleteTarget.id}`);
      toast.success(`Deleted page "${deleteTarget.title}".`);
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
      <h1 className="text-3xl text-primary">Pages &amp; SEO</h1>
      <p className="mt-1 text-sm text-muted">Manage static content pages (About, Terms, Privacy, Visa Info) and search metadata.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        <label className="text-xs font-semibold">
          Page title *
          <input required placeholder="Terms & Conditions" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          URL slug
          <input placeholder="terms-and-conditions" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>

        <label className="text-xs font-semibold sm:col-span-3">
          Page content *
          <textarea rows={5} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          SEO title
          <input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-2">
          SEO meta description
          <input value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} className={inp} />
        </label>

        <div className="flex gap-3 sm:col-span-3">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update page" : "Create page"}
          </button>
          {editingId && <button type="button" onClick={reset} className="text-sm font-semibold text-primary underline">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> : !data.length ? <div className="p-6"><Empty>No CMS pages created yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th>Slug</th>
                <th>SEO Title</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3 font-semibold text-primary">{p.title}</td>
                  <td className="font-mono text-xs text-muted">/pages/{p.slug}</td>
                  <td className="text-xs text-muted">{p.seo_title || "—"}</td>
                  <td><StatusBadge value={p.status} /></td>
                  <td className="whitespace-nowrap">{formatDateTime(p.updated_at)}</td>
                  <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                    <button onClick={() => startEdit(p)} className="text-primary underline">Edit</button>
                    <button onClick={() => setDeleteTarget(p)} className="text-terracotta underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        tone="danger"
        title="Delete CMS page?"
        description={deleteTarget ? `Delete "${deleteTarget.title}" (/pages/${deleteTarget.slug})? Visitors following this link will see a 404.` : ""}
        confirmLabel="Delete page"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}