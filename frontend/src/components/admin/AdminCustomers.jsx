"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import { useCan } from "./AdminShell";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDate } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminCustomers() {
  const can = useCan();
  const [f, setF] = useState({ search: "", status: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState("");
  const qs = new URLSearchParams({ page, limit: 20 });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { data, raw, error, loading, reload } = useFetch(`/admin/customers?${qs}`);
  const pg = raw?.pagination;

  const toggle = async (c) => {
    const status = c.account_status === "active" ? "suspended" : "active";
    const reason = status === "suspended" ? window.prompt(`Reason for suspending ${c.name}?`) : "";
    if (status === "suspended" && reason === null) return;
    setMsg("");
    try { await api.patch(`/admin/customers/${c.id}/status`, { status, ...(reason && { reason }) }); await reload(); }
    catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Customers</h1>
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(f); }} className="mt-6 flex flex-wrap gap-3">
        <input value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} placeholder="Name, email, phone" aria-label="Search" className={`${sel} w-64`} />
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel} aria-label="Status">
          <option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option>
        </select>
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
      </form>
      {msg && <p role="alert" className="mt-3 text-sm text-terracotta">{msg}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !data.length ? <div className="p-6"><Empty>No customers found.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">Customer</th><th>Phone</th><th>Status</th><th>Bookings</th><th>Joined</th><th className="pr-5" /></tr></thead>
            <tbody className="divide-y divide-border">
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-semibold text-primary">{c.name}<br /><span className="text-xs font-normal text-muted">{c.email}</span></td>
                  <td>{c.phone || "—"}</td>
                  <td><StatusBadge value={c.account_status} /></td>
                  <td>{c.confirmed_or_completed_bookings}/{c.total_bookings}</td>
                  <td>{formatDate(c.created_at)}</td>
                  <td className="pr-5 text-right">{can("customers.suspend") && <button onClick={() => toggle(c)} className="text-xs font-semibold text-primary underline">{c.account_status === "active" ? "Suspend" : "Reactivate"}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pg?.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {pg.pages}</span>
          <button disabled={page >= pg.pages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}
