"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDate } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = {
  tour_id: "",
  name: "",
  start_date: "",
  end_date: "",
  adjustment_type: "percentage",
  adjustment_value: "15",
  status: "active",
};

export default function AdminSeasonalPricing() {
  const { data: tours } = useFetch("/admin/tours?limit=100");
  const { data, error, loading, reload } = useFetch("/admin/seasonal-pricing");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      tour_id: r.tour_id ? String(r.tour_id) : "",
      name: r.name,
      start_date: String(r.start_date).slice(0, 10),
      end_date: String(r.end_date).slice(0, 10),
      adjustment_type: r.adjustment_type,
      adjustment_value: String(r.adjustment_value),
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
    setMsg({ type: "", text: "" });
    try {
      const payload = {
        ...form,
        tour_id: form.tour_id ? Number(form.tour_id) : null,
        adjustment_value: Number(form.adjustment_value),
      };
      if (editingId) {
        await api.patch(`/admin/seasonal-pricing/${editingId}`, payload);
        setMsg({ type: "ok", text: "Seasonal rule updated." });
      } else {
        await api.post("/admin/seasonal-pricing", payload);
        setMsg({ type: "ok", text: "Seasonal pricing rule created." });
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
    if (!window.confirm(`Delete seasonal rule "${r.name}"?`)) return;
    await api.delete(`/admin/seasonal-pricing/${r.id}`);
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Seasonal pricing</h1>
      <p className="mt-1 text-sm text-muted">Configure peak-season surcharges or off-peak discounts globally or per tour.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <h2 className="text-lg text-primary">{editingId ? `Edit rule #${editingId}` : "New seasonal pricing rule"}</h2>
        </div>

        <label className="text-xs font-semibold lg:col-span-2">
          Rule name *
          <input required placeholder="Winter Peak Season (Dec–Jan)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold lg:col-span-2">
          Applies to tour
          <select value={form.tour_id} onChange={(e) => setForm({ ...form, tour_id: e.target.value })} className={inp}>
            <option value="">All tours (Global rule)</option>
            {(tours || []).map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold">
          Start date *
          <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          End date *
          <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Adjustment type
          <select value={form.adjustment_type} onChange={(e) => setForm({ ...form, adjustment_type: e.target.value })} className={inp}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>

        <label className="text-xs font-semibold">
          Value (+ surcharge / - discount) *
          <input type="number" step="0.01" required value={form.adjustment_value} onChange={(e) => setForm({ ...form, adjustment_value: e.target.value })} className={inp} />
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
            {busy ? "Saving…" : editingId ? "Update rule" : "Create rule"}
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
          <div className="p-6"><Empty>No seasonal pricing rules yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Season</th>
                <th>Scope</th>
                <th>Window</th>
                <th>Adjustment</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((r) => {
                const val = Number(r.adjustment_value);
                const sign = val >= 0 ? "+" : "";
                return (
                  <tr key={r.id} className="hover:bg-primary/5">
                    <td className="px-5 py-3 font-semibold text-primary">{r.name}</td>
                    <td>{r.tour_title || <span className="text-muted">All tours</span>}</td>
                    <td className="whitespace-nowrap">{formatDate(r.start_date)} → {formatDate(r.end_date)}</td>
                    <td className="font-semibold">
                      {sign}{r.adjustment_type === "percentage" ? `${val}%` : val}
                    </td>
                    <td><StatusBadge value={r.status} /></td>
                    <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                      <button onClick={() => startEdit(r)} className="text-primary underline">Edit</button>
                      <button onClick={() => remove(r)} className="text-terracotta underline">Delete</button>
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