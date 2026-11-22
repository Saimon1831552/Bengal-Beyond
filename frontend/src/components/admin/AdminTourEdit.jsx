"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "@/components/account/State";
import TourForm from "./TourForm";
import TourTaxonomy from "./TourTaxonomy";
import DepartureManager from "./DepartureManager";
import { useCan } from "./AdminShell";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUSES = ["draft", "published", "unpublished", "archived"];
const BLANK_ADDON = {
  name: "",
  description: "",
  price: "",
  pricing_mode: "per_person",
  is_active: true,
};

function TourAddonsPanel({ tourId }) {
  const { data, error, loading, reload } = useFetch(`/admin/tour-addons?tour_id=${tourId}`);
  const [form, setForm] = useState(BLANK_ADDON);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = (addon) => {
    setEditingId(addon.id);
    setForm({
      name: addon.name,
      description: addon.description || "",
      price: String(addon.price),
      pricing_mode: addon.pricing_mode,
      is_active: Boolean(addon.is_active),
    });
  };

  const reset = () => {
    setEditingId(null);
    setForm(BLANK_ADDON);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const payload = {
        ...form,
        tour_id: Number(tourId),
        price: Number(form.price),
        is_active: form.is_active ? 1 : 0,
      };
      if (editingId) {
        await api.patch(`/admin/tour-addons/${editingId}`, payload);
        setMsg({ type: "ok", text: "Add-on updated." });
      } else {
        await api.post("/admin/tour-addons", payload);
        setMsg({ type: "ok", text: "Add-on added." });
      }
      reset();
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (addon) => {
    if (!window.confirm(`Delete add-on "${addon.name}"?`)) return;
    setMsg({ type: "", text: "" });
    try {
      await api.delete(`/admin/tour-addons/${addon.id}`);
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-border bg-white p-6">
      <h2 className="text-xl text-primary">Tour add-ons &amp; extras</h2>
      <p className="mt-1 text-xs text-muted">Optional extras customers can attach when booking this tour.</p>

      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold">
          Add-on name *
          <input required placeholder="Private Airport Transfer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </label>

        <label className="text-xs font-semibold">
          Price *
          <input type="number" min={0} step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </label>

        <label className="text-xs font-semibold">
          Pricing mode
          <select value={form.pricing_mode} onChange={(e) => setForm({ ...form, pricing_mode: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm">
            <option value="per_person">Per person</option>
            <option value="per_booking">Per booking</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pt-5 text-xs font-semibold">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active on booking form
        </label>

        <label className="text-xs font-semibold sm:col-span-2 lg:col-span-4">
          Description
          <input placeholder="Optional details shown to travelers" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </label>

        {msg.text && (
          <p role={msg.type === "error" ? "alert" : undefined} className={`text-xs sm:col-span-2 lg:col-span-4 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update add-on" : "Add extra"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="text-xs font-semibold text-primary underline">Cancel</button>
          )}
        </div>
      </form>

      <div className="mt-5">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : !data?.length ? (
          <p className="text-xs text-muted">No add-ons configured for this tour yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {data.map((addon) => (
              <li key={addon.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <span className="font-semibold text-primary">{addon.name}</span>
                  <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {addon.price} ({addon.pricing_mode === "per_person" ? "per person" : "per booking"})
                  </span>
                  {!addon.is_active && <span className="ml-2 text-xs font-semibold text-terracotta">Inactive</span>}
                  {addon.description && <span className="block text-xs text-muted">{addon.description}</span>}
                </div>
                <div className="space-x-3 text-xs font-semibold">
                  <button type="button" onClick={() => startEdit(addon)} className="text-primary underline">Edit</button>
                  <button type="button" onClick={() => remove(addon)} className="text-terracotta underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function AdminTourEdit({ id }) {
  const router = useRouter();
  const can = useCan();
  const { data: t, error, loading, reload } = useFetch(`/admin/tours/${encodeURIComponent(id)}`);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const setStatus = async (status) => {
    setBusy(status); setMsg("");
    try { await api.patch(`/admin/tours/${t.id}/status`, { status }); await reload(); }
    catch (e) { setMsg(errMsg(e)); } finally { setBusy(""); }
  };
  const remove = async () => {
    if (!window.confirm("Delete this tour? It disappears from the site. Existing bookings are kept.")) return;
    setBusy("delete");
    try { await api.delete(`/admin/tours/${t.id}`); router.push("/admin/tours"); }
    catch (e) { setMsg(errMsg(e)); setBusy(""); }
  };

  return (
    <Container as="main" className="max-w-4xl space-y-8 py-8">
      <Link href="/admin/tours" className="text-sm text-accent link-underline">← All tours</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-primary">{t.title}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge value={t.status} />
          {t.status === "published" && <Link href={`/tours/${t.slug}`} target="_blank" className="text-sm font-semibold text-accent underline">View on site ↗</Link>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <span className="text-sm font-medium">Status:</span>
        {STATUSES.filter((s) => s !== t.status).map((s) => (
          <button key={s} onClick={() => setStatus(s)} disabled={!!busy}
            className={`rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 ${s === "published" ? "btn-gold" : "border border-primary text-primary"}`}>
            {busy === s ? "…" : s === "published" ? "Publish" : titleCase(s)}
          </button>
        ))}
        {msg && <p role="alert" className="w-full text-sm text-terracotta">{msg}</p>}
      </div>

      <TourForm key={t.updated_at} tour={t} onSaved={reload} />
      {can("content.manage") && <TourTaxonomy tourId={t.id} />}

      {can("departures.manage")
        ? <DepartureManager tourId={t.id} currency={t.currency_code} basePrice={t.base_price} />
        : <p className="text-sm text-muted">You don&apos;t have permission to manage departures.</p>}

      {can("tours.manage") && <TourAddonsPanel tourId={t.id} />}

      <div className="border-t border-border pt-6">
        <button onClick={remove} disabled={!!busy} className="text-sm font-semibold text-terracotta underline">Delete this tour</button>
      </div>
    </Container>
  );
}