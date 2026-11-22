"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime } from "@/lib/format";
import { errMsg } from "@/lib/errors";

export default function AdminNewsletter() {
  const { data, error, loading, reload } = useFetch("/admin/newsletter");
  const [form, setForm] = useState({ email: "", full_name: "" });
  const [msg, setMsg] = useState("");

  const add = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/admin/newsletter", form);
      setForm({ email: "", full_name: "" });
      setMsg("Subscriber added.");
      await reload();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };

  const toggle = async (s) => {
    await api.patch(`/admin/newsletter/${s.id}`, { status: s.status === "subscribed" ? "unsubscribed" : "subscribed" });
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Newsletter subscribers</h1>
      <p className="mt-1 text-sm text-muted">Manage email subscribers for seasonal tour announcements and travel guides.</p>

      <form onSubmit={add} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white p-5">
        <label className="text-xs font-semibold">
          Email *
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 block rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold">
          Full name
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 block rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </label>
        <button className="btn-gold rounded-full px-6 py-2 text-sm font-semibold">Add subscriber</button>
        {msg && <span className="text-xs text-primary">{msg}</span>}
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> : !data.length ? <div className="p-6"><Empty>No newsletter subscribers yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Email</th>
                <th>Name</th>
                <th>Status</th>
                <th>Subscribed</th>
                <th className="pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((s) => (
                <tr key={s.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3 font-medium text-primary">{s.email}</td>
                  <td>{s.full_name || "—"}</td>
                  <td><StatusBadge value={s.status} /></td>
                  <td>{formatDateTime(s.subscribed_at)}</td>
                  <td className="pr-5 text-right text-xs font-semibold">
                    <button onClick={() => toggle(s)} className="text-primary underline">
                      {s.status === "subscribed" ? "Unsubscribe" : "Re-subscribe"}
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