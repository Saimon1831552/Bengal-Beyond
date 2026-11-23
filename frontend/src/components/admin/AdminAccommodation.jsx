"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const EMPTY = { destination_id: "", name: "", type: "hotel", star_rating: "4", base_rate_per_night: "", currency_code: "BDT", status: "active" };
const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent";

const toArray = (v) => (Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : []);

export default function AdminAccommodation() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch("/admin/accommodation");
  const { data: destinationsRaw } = useFetch("/admin/destinations?limit=100");
  const destinations = toArray(destinationsRaw);
  const rows = toArray(data);

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        destination_id: form.destination_id ? Number(form.destination_id) : null,
        name: form.name.trim(),
        type: form.type,
        star_rating: form.star_rating ? Number(form.star_rating) : null,
        base_rate_per_night: Number(form.base_rate_per_night),
        currency_code: form.currency_code.trim().toUpperCase() || "BDT",
        status: form.status,
      };
      if (editing) {
        await api.patch(`/admin/accommodation/${editing}`, payload);
        toast.success("Accommodation updated.");
      } else {
        await api.post("/admin/accommodation", payload);
        toast.success("Accommodation added.");
      }
      setForm(EMPTY);
      setEditing(null);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const edit = (a) => {
    setEditing(a.id);
    setForm({
      destination_id: a.destination_id || "",
      name: a.name || "",
      type: a.type || "hotel",
      star_rating: a.star_rating ?? "4",
      base_rate_per_night: a.base_rate_per_night ?? "",
      currency_code: a.currency_code || "BDT",
      status: a.status || "active",
    });
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await api.delete(`/admin/accommodation/${id}`);
      toast.success("Accommodation deleted.");
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container as="main" className="py-8">
      <div>
        <h1 className="text-3xl text-primary">Accommodation partners</h1>
        <p className="mt-1 text-sm text-muted">Manage partner hotels, resorts, houseboats, and eco-camps.</p>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-primary">
          Property name *
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold text-primary">
          Destination
          <select value={form.destination_id} onChange={(e) => setForm({ ...form, destination_id: e.target.value })} className={inp}>
            <option value="">Select destination…</option>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Type
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inp}>
            <option value="hotel">Hotel</option>
            <option value="resort">Resort</option>
            <option value="eco_camp">Eco Camp</option>
            <option value="houseboat">Houseboat</option>
            <option value="guesthouse">Guesthouse</option>
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Star rating (1–5)
          <input type="number" min={1} max={5} value={form.star_rating} onChange={(e) => setForm({ ...form, star_rating: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold text-primary">
          Base rate / night *
          <input required type="number" min={0} step="0.01" value={form.base_rate_per_night} onChange={(e) => setForm({ ...form, base_rate_per_night: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold text-primary">
          Currency
          <input maxLength={3} value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold text-primary">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editing ? "Update" : "Add property"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="rounded-full border border-border px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !rows.length ? (
          <div className="p-6"><Empty>No accommodation partners added yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Property</th>
                <th>Destination</th>
                <th>Type</th>
                <th>Rating</th>
                <th>Rate / night</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3 font-semibold text-primary">{a.name}</td>
                  <td>{a.destination_name || "—"}</td>
                  <td>{titleCase(a.type)}</td>
                  <td>{a.star_rating ? `${a.star_rating} ★` : "—"}</td>
                  <td className="font-semibold text-primary">{money(a.base_rate_per_night, a.currency_code)}</td>
                  <td><StatusBadge value={a.status} /></td>
                  <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                    <button onClick={() => edit(a)} className="text-primary underline">Edit</button>
                    <button onClick={() => setDeleteTarget(a)} className="text-terracotta underline">Delete</button>
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
        title="Delete accommodation partner?"
        description={deleteTarget ? `Delete "${deleteTarget.name}" permanently?` : ""}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={async () => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) await remove(target.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}