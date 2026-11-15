"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUSES = ["queued", "processing", "sent", "failed"];

export default function AdminEmails() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState("");
  const { data, error, loading, reload } = useFetch(`/admin/notifications/jobs?page=${page}&limit=20${status ? `&status=${status}` : ""}`);
  const items = data?.items || [];

  const retry = async (id) => {
    setMsg("");
    try { await api.post(`/admin/notifications/jobs/${id}/retry`); await reload(); }
    catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Email log</h1>
      <p className="mt-2 text-sm text-muted">Emails are sent by the notification worker. If jobs stay &ldquo;queued&rdquo;, the worker is not running.</p>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status" className="mt-6 rounded-xl border border-border bg-white px-3 py-2 text-sm">
        <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
      </select>
      {msg && <p role="alert" className="mt-3 text-sm text-terracotta">{msg}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !items.length ? <div className="p-6"><Empty>No emails yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">To</th><th>Template</th><th>Status</th><th>Tries</th><th>Created</th><th className="pr-5" /></tr></thead>
            <tbody className="divide-y divide-border">
              {items.map((j) => (
                <tr key={j.id} className="align-top">
                  <td className="px-5 py-3">{j.recipient}{j.last_error && <span className="block max-w-xs text-xs text-terracotta">{j.last_error}</span>}</td>
                  <td className="font-mono text-xs">{j.template_key}</td>
                  <td><StatusBadge value={j.status} /></td>
                  <td>{j.attempts}/{j.max_attempts}</td>
                  <td>{formatDateTime(j.created_at)}</td>
                  <td className="pr-5 text-right">{j.status === "failed" && <button onClick={() => retry(j.id)} className="text-xs font-semibold text-primary underline">Retry</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
        <button disabled={items.length < 20} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
      </div>
    </Container>
  );
}