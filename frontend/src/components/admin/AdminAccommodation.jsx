"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const PROP_TYPES = ["hotel", "resort", "eco_lodge", "boat_cabin", "guesthouse"];
const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = {
  destination_id: "",
  name: "",
  property_type: "hotel",
  star_rating: "",
  address: "",
  contact_person: "",
  contact_phone: "",
  nightly_rate: "0",
  status: "active",
  notes: "",
};

export default function AdminAccommodation() {
  const { data: destinations } = useFetch("/admin/destinations");
  const { data, error, loading, reload } = useFetch("/admin/accommodation");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      destination_id: a.destination_id ? String(a.destination_id) : "",
      name: a.name,
      property_type: a.property_type,
      star_rating: a.star_rating ?? "",
      address: a.address || "",
      contact_person: a.contact_person || "",
      contact_phone: a.contact_phone || "",
      nightly_rate: String(a.nightly_rate),
      status: a.status,
      notes: a.notes || "",
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
        destination_id: form.destination_id ? Number(form.destination_id) : null,
        star_rating: form.star_rating === "" ? null : Number(form.star_rating),
        nightly_rate: Number(form.nightly_rate),
      };
      if (editingId) {
        await api.patch(`/admin/accommodation/${editingId}`, payload);
        setMsg({ type: "ok", text: "Partner property updated." });
      } else {
        await api.post("/admin/accommodation", payload);
        setMsg({ type: "ok", text: "Partner property added." });
      }
      reset();
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete partner property "${a.name}"?`)) return;
    await api.delete(`/admin/accommodation/${a.id}`);
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Accommodation partners</h1>
      <p className="mt-1 text-sm text-muted">Manage partner hotels, resorts, eco-lodges, and overnight houseboats by destination.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <h2 className="text-lg text-primary">{editingId ? `Edit property #${editingId}` : "Add partner property"}</h2>
        </div>

        <label className="text-xs font-semibold lg:col-span-2">
          Property name *
          <input required placeholder="Seagull Beach Resort" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Destination
          <select value={form.destination_id} onChange={(e) => setForm({ ...form, destination_id: e.target.value })} className={inp}>
            <option value="">Select destination…</option>
            {(destinations || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>

        <label className="text-xs font-semibold">
          Property type
          <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className={inp}>
            {PROP_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
        </label>

        <label className="text-xs font-semibold">
          Star rating (1–5)
          <input type="number" min={1} max={5} value={form.star_rating} onChange={(e) => setForm({ ...form, star_rating: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Nightly rate (BDT)
          <input type="number" min={0} step="0.01" value={form.nightly_rate} onChange={(e) => setForm({ ...form, nightly_rate: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Contact person
          <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Contact phone
          <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold sm:col-span-2">
          Address
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        {msg.text && (
          <p className={`text-sm sm:col-span-2 lg:col-span-4 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update property" : "Add property"}
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
          <div className="p-6"><Empty>No accommodation partners added yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Property</th>
                <th>Destination</th>
                <th>Contact</th>
                <th>Nightly Rate</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((a) => (
                <tr key={a.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3">
                    <span className="font-semibold text-primary">{a.name}</span>
                    <span className="block text-xs text-muted">
                      {titleCase(a.property_type)}{a.star_rating ? ` · ${a.star_rating}★` : ""}
                    </span>
                  </td>
                  <td>{a.destination_name || <span className="text-muted">—</span>}</td>
                  <td>
                    {a.contact_person || <span className="text-muted">—</span>}
                    {a.contact_phone && <span className="block text-xs text-muted">{a.contact_phone}</span>}
                  </td>
                  <td>{money(a.nightly_rate, "BDT")}</td>
                  <td><StatusBadge value={a.status} /></td>
                  <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                    <button onClick={() => startEdit(a)} className="text-primary underline">Edit</button>
                    <button onClick={() => remove(a)} className="text-terracotta underline">Delete</button>
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