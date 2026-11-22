"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = {
  tour_id: "",
  name: "",
  slug: "",
  description: "",
  price_per_person: "",
  min_travelers: 1,
  max_travelers: "",
  inclusions: "",
  status: "active",
};

function parseInclusions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminPackages() {
  const { data: tours } = useFetch("/admin/tours?limit=100");
  const { data, error, loading, reload } = useFetch("/admin/packages");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      tour_id: String(p.tour_id),
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      price_per_person: String(p.price_per_person),
      min_travelers: p.min_travelers || 1,
      max_travelers: p.max_travelers ?? "",
      inclusions: parseInclusions(p.inclusions_json).join("\n"),
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
    setMsg({ type: "", text: "" });
    try {
      const payload = {
        ...form,
        tour_id: Number(form.tour_id),
        price_per_person: Number(form.price_per_person),
        min_travelers: Number(form.min_travelers) || 1,
        max_travelers: form.max_travelers === "" ? null : Number(form.max_travelers),
      };
      if (editingId) {
        await api.patch(`/admin/packages/${editingId}`, payload);
        setMsg({ type: "ok", text: "Package updated." });
      } else {
        await api.post("/admin/packages", payload);
        setMsg({ type: "ok", text: "Tour package created." });
      }
      reset();
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete package "${p.name}"?`)) return;
    await api.delete(`/admin/packages/${p.id}`);
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Tour packages &amp; tiers</h1>
      <p className="mt-1 text-sm text-muted">Define tiered pricing options (e.g., Standard Group, Deluxe Resort, Private VIP) for tours.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <h2 className="text-lg text-primary">{editingId ? `Edit package #${editingId}` : "New tour package"}</h2>
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
          Package name *
          <input required placeholder="Deluxe Sea-View Tier" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Price per person *
          <input type="number" min={0} step="0.01" required value={form.price_per_person} onChange={(e) => setForm({ ...form, price_per_person: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Min travelers
          <input type="number" min={1} value={form.min_travelers} onChange={(e) => setForm({ ...form, min_travelers: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Max travelers
          <input type="number" min={1} placeholder="No limit" value={form.max_travelers} onChange={(e) => setForm({ ...form, max_travelers: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="text-xs font-semibold sm:col-span-2">
          Short description
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-2">
          Inclusions (one per line)
          <textarea rows={3} placeholder={"4-star beachfront hotel\nAC private transfer\nAll breakfasts"} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} className={inp} />
        </label>

        {msg.text && (
          <p className={`text-sm sm:col-span-2 lg:col-span-4 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update package" : "Create package"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="text-sm font-semibold text-primary underline">Cancel</button>
          )}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !data.length ? (
          <div className="p-6"><Empty>No tour packages created yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Tour</th>
                <th>Package</th>
                <th>Price / Person</th>
                <th>Group Size</th>
                <th>Inclusions</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((p) => {
                const inc = parseInclusions(p.inclusions_json);
                return (
                  <tr key={p.id} className="hover:bg-primary/5">
                    <td className="px-5 py-3 font-medium text-primary">{p.tour_title}</td>
                    <td>
                      <span className="font-semibold text-primary">{p.name}</span>
                      {p.description && <span className="block text-xs text-muted">{p.description}</span>}
                    </td>
                    <td className="font-semibold">{money(p.price_per_person, "BDT")}</td>
                    <td>{p.min_travelers}{p.max_travelers ? `–${p.max_travelers}` : "+"} pax</td>
                    <td className="text-xs text-muted">{inc.length ? inc.join(" · ") : "—"}</td>
                    <td><StatusBadge value={p.status} /></td>
                    <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                      <button onClick={() => startEdit(p)} className="text-primary underline">Edit</button>
                      <button onClick={() => remove(p)} className="text-terracotta underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
}