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

const TYPES = ["sedan", "suv", "microbus", "tourist_coach", "boat", "other"];
const STATUSES = ["available", "in_service", "maintenance", "inactive"];
const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = {
  name: "",
  vehicle_type: "microbus",
  registration_number: "",
  seat_capacity: 10,
  driver_name: "",
  driver_phone: "",
  daily_rate: "0",
  status: "available",
  notes: "",
};

export default function AdminVehicles() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch("/admin/vehicles");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const startEdit = (v) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      vehicle_type: v.vehicle_type,
      registration_number: v.registration_number,
      seat_capacity: v.seat_capacity,
      driver_name: v.driver_name || "",
      driver_phone: v.driver_phone || "",
      daily_rate: String(v.daily_rate),
      status: v.status,
      notes: v.notes || "",
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
      const payload = { ...form, seat_capacity: Number(form.seat_capacity), daily_rate: Number(form.daily_rate) };
      if (editingId) {
        await api.patch(`/admin/vehicles/${editingId}`, payload);
        toast.success("Vehicle updated.");
      } else {
        await api.post("/admin/vehicles", payload);
        toast.success("Vehicle added to fleet.");
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
      await api.delete(`/admin/vehicles/${deleteTarget.id}`);
      toast.success(`Deleted vehicle "${deleteTarget.name}".`);
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
      <h1 className="text-3xl text-primary">Vehicles &amp; transport</h1>
      <p className="mt-1 text-sm text-muted">Manage tour fleet vehicles, tourist boats, seat capacities, and assigned drivers.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <h2 className="text-lg text-primary">{editingId ? `Edit vehicle #${editingId}` : "Add fleet vehicle"}</h2>
        </div>

        <label className="text-xs font-semibold">
          Vehicle name / model *
          <input required placeholder="Toyota HiAce Grand Cabin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Type
          <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className={inp}>
            {TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
        </label>

        <label className="text-xs font-semibold">
          Registration number *
          <input required placeholder="DHAKA-METRO-CHA-11-2345" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Seat capacity
          <input type="number" min={1} max={120} value={form.seat_capacity} onChange={(e) => setForm({ ...form, seat_capacity: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Driver name
          <input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Driver phone
          <input value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Daily rate (BDT)
          <input type="number" min={0} step="0.01" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </label>

        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update vehicle" : "Add vehicle"}
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
          <div className="p-6"><Empty>No vehicles registered yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Vehicle</th>
                <th>Registration</th>
                <th>Seats</th>
                <th>Driver</th>
                <th>Daily Rate</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((v) => (
                <tr key={v.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3">
                    <span className="font-semibold text-primary">{v.name}</span>
                    <span className="block text-xs text-muted">{titleCase(v.vehicle_type)}</span>
                  </td>
                  <td className="font-mono text-xs">{v.registration_number}</td>
                  <td>{v.seat_capacity} pax</td>
                  <td>
                    {v.driver_name || <span className="text-muted">—</span>}
                    {v.driver_phone && <span className="block text-xs text-muted">{v.driver_phone}</span>}
                  </td>
                  <td>{money(v.daily_rate, "BDT")}</td>
                  <td><StatusBadge value={v.status} /></td>
                  <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                    <button onClick={() => startEdit(v)} className="text-primary underline">Edit</button>
                    <button onClick={() => setDeleteTarget(v)} className="text-terracotta underline">Delete</button>
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
        title="Delete fleet vehicle?"
        description={deleteTarget ? `Remove "${deleteTarget.name}" (${deleteTarget.registration_number}) from your transport fleet?` : ""}
        confirmLabel="Delete vehicle"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}