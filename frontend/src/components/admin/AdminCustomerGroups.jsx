"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";
const BLANK = { name: "", description: "", discount_percent: "5", min_bookings: 1, status: "active" };

export default function AdminCustomerGroups() {
  const { data, error, loading, reload } = useFetch("/admin/customer-groups");
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const startEdit = (g) => {
    setEditingId(g.id);
    setForm({
      name: g.name,
      description: g.description || "",
      discount_percent: String(g.discount_percent),
      min_bookings: g.min_bookings,
      status: g.status,
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
      const payload = { ...form, discount_percent: Number(form.discount_percent), min_bookings: Number(form.min_bookings) };
      if (editingId) {
        await api.patch(`/admin/customer-groups/${editingId}`, payload);
        setMsg({ type: "ok", text: "Group updated." });
      } else {
        await api.post("/admin/customer-groups", payload);
        setMsg({ type: "ok", text: "Customer group created." });
      }
      reset();
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (g) => {
    if (!window.confirm(`Delete group "${g.name}"?`)) return;
    await api.delete(`/admin/customer-groups/${g.id}`);
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Customer groups &amp; loyalty tiers</h1>
      <p className="mt-1 text-sm text-muted">Define loyalty segments (e.g., Repeat Explorer, Corporate, VIP) and tier perks.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-4">
        <label className="text-xs font-semibold">
          Tier / group name *
          <input required placeholder="Repeat Explorer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Tier discount (%)
          <input type="number" min={0} max={100} step="0.1" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Min completed bookings
          <input type="number" min={0} value={form.min_bookings} onChange={(e) => setForm({ ...form, min_bookings: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="text-xs font-semibold sm:col-span-4">
          Description &amp; perks
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} />
        </label>

        {msg.text && <p className={`text-sm sm:col-span-4 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}

        <div className="flex gap-3 sm:col-span-4">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : editingId ? "Update group" : "Create group"}
          </button>
          {editingId && <button type="button" onClick={reset} className="text-sm font-semibold text-primary underline">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> : !data.length ? <div className="p-6"><Empty>No customer groups created yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Group</th>
                <th>Qualification</th>
                <th>Perk Discount</th>
                <th>Status</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((g) => (
                <tr key={g.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3">
                    <span className="font-semibold text-primary">{g.name}</span>
                    {g.description && <span className="block text-xs text-muted">{g.description}</span>}
                  </td>
                  <td>{g.min_bookings}+ bookings</td>
                  <td className="font-semibold text-accent">{Number(g.discount_percent)}%</td>
                  <td><StatusBadge value={g.status} /></td>
                  <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                    <button onClick={() => startEdit(g)} className="text-primary underline">Edit</button>
                    <button onClick={() => remove(g)} className="text-terracotta underline">Delete</button>
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