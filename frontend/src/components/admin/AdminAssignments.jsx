"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent";

const toArray = (v) => (Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : []);

export default function AdminAssignments() {
  const toast = useToast();
  const { data: assignments, error, loading, reload } = useFetch("/admin/assignments");
  const { data: bookingsRaw } = useFetch("/admin/bookings?limit=100");
  const { data: guidesRaw } = useFetch("/admin/guides");
  const { data: vehiclesRaw } = useFetch("/admin/vehicles");

  const bookings = toArray(bookingsRaw);
  const guides = toArray(guidesRaw);
  const vehicles = toArray(vehiclesRaw);
  const assignmentList = toArray(assignments);

  const [form, setForm] = useState({ entity_id: "", guide_id: "", vehicle_id: "", role_label: "Lead Guide", notes: "" });
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const assign = async (e) => {
    e.preventDefault();
    if (!form.guide_id && !form.vehicle_id) return toast.error("Select a guide and/or vehicle.");
    setBusy(true);
    try {
      await api.post("/admin/assignments", {
        entity_type: "booking",
        entity_id: Number(form.entity_id),
        guide_id: form.guide_id ? Number(form.guide_id) : null,
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
        role_label: form.role_label.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success("Resource assigned.");
      setForm({ entity_id: "", guide_id: "", vehicle_id: "", role_label: "Lead Guide", notes: "" });
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await api.delete(`/admin/assignments/${id}`);
      toast.success("Assignment removed.");
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
        <h1 className="text-3xl text-primary">Guide &amp; vehicle assignments</h1>
        <p className="mt-1 text-sm text-muted">Assign tour guides and fleet vehicles to upcoming bookings.</p>
      </div>

      <form onSubmit={assign} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-semibold text-primary">
          Booking *
          <select required value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} className={inp}>
            <option value="">Choose booking…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>{b.booking_reference} — {b.customer_name}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Guide
          <select value={form.guide_id} onChange={(e) => setForm({ ...form, guide_id: e.target.value })} className={inp}>
            <option value="">None</option>
            {guides.filter((g) => g.status === "active").map((g) => (
              <option key={g.id} value={g.id}>{g.full_name} ({g.specialty || "Guide"})</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Vehicle
          <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={inp}>
            <option value="">None</option>
            {vehicles.filter((v) => v.status === "available").map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.capacity} pax)</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-primary">
          Role
          <input value={form.role_label} onChange={(e) => setForm({ ...form, role_label: e.target.value })} className={inp} />
        </label>

        <div className="flex items-end">
          <button disabled={busy} className="btn-gold w-full rounded-full py-2 text-sm font-semibold disabled:opacity-50">
            {busy ? "Assigning…" : "Assign"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !assignmentList.length ? (
          <div className="p-6"><Empty>No active assignments.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Target</th>
                <th>Guide</th>
                <th>Vehicle</th>
                <th>Role</th>
                <th>Status</th>
                <th>Assigned</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignmentList.map((a) => (
                <tr key={a.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3 font-semibold text-primary">
                    {titleCase(a.entity_type)} #{a.entity_id}
                  </td>
                  <td>{a.guide_name || "—"}</td>
                  <td>{a.vehicle_name ? `${a.vehicle_name} (${a.plate_number})` : "—"}</td>
                  <td>{a.role_label || "—"}</td>
                  <td><StatusBadge value={a.status} /></td>
                  <td className="whitespace-nowrap">{formatDateTime(a.assigned_at)}</td>
                  <td className="pr-5 text-right text-xs font-semibold">
                    <button onClick={() => setDeleteTarget(a)} className="text-terracotta underline">Remove</button>
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
        title="Remove assignment?"
        description={deleteTarget ? `Remove assignment for ${titleCase(deleteTarget.entity_type)} #${deleteTarget.entity_id}?` : ""}
        confirmLabel="Remove"
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