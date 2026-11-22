"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money } from "@/lib/format";
import { errMsg } from "@/lib/errors";

export default function AdminReferrals() {
  const { data, error, loading, reload } = useFetch("/admin/referrals");
  const [form, setForm] = useState({ code: "", owner_user_id: "", reward_amount: "500" });
  const [msg, setMsg] = useState("");

  const create = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/admin/referrals", {
        code: form.code,
        owner_user_id: form.owner_user_id ? Number(form.owner_user_id) : null,
        reward_amount: Number(form.reward_amount),
      });
      setForm({ code: "", owner_user_id: "", reward_amount: "500" });
      setMsg("Referral code created.");
      await reload();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };

  const toggle = async (r) => {
    await api.patch(`/admin/referrals/${r.id}`, { status: r.status === "active" ? "inactive" : "active" });
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Referral program</h1>
      <p className="mt-1 text-sm text-muted">Issue ambassador and traveler referral codes with reward credits.</p>

      <form onSubmit={create} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white p-5">
        <label className="text-xs font-semibold">
          Referral code *
          <input required placeholder="BENGALFRIEND10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1 block rounded-xl border border-border bg-white px-3 py-2 text-sm uppercase" />
        </label>
        <label className="text-xs font-semibold">
          Owner user ID (optional)
          <input type="number" min={1} placeholder="e.g. 2" value={form.owner_user_id} onChange={(e) => setForm({ ...form, owner_user_id: e.target.value })} className="mt-1 block rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold">
          Reward amount (BDT)
          <input type="number" min={0} value={form.reward_amount} onChange={(e) => setForm({ ...form, reward_amount: e.target.value })} className="mt-1 block rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </label>
        <button className="btn-gold rounded-full px-6 py-2 text-sm font-semibold">Create code</button>
        {msg && <span className="text-xs text-primary">{msg}</span>}
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> : !data.length ? <div className="p-6"><Empty>No referral codes yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th>Ambassador / Owner</th>
                <th>Reward</th>
                <th>Referrals</th>
                <th>Status</th>
                <th className="pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3 font-mono font-bold text-primary">{r.code}</td>
                  <td>{r.owner_name ? `${r.owner_name} (${r.owner_email})` : <span className="text-muted">General promo</span>}</td>
                  <td className="font-semibold">{money(r.reward_amount, "BDT")}</td>
                  <td>{r.referrals_count}</td>
                  <td><StatusBadge value={r.status} /></td>
                  <td className="pr-5 text-right text-xs font-semibold">
                    <button onClick={() => toggle(r)} className="text-primary underline">
                      {r.status === "active" ? "Deactivate" : "Activate"}
                    </button>
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