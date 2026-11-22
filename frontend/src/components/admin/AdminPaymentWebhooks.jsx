"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUSES = ["", "received", "processing", "processed", "failed"];

export default function AdminPaymentWebhooks() {
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [msg, setMsg] = useState("");

  const qs = status ? `?status=${status}` : "";
  const { data, error, loading, reload } = useFetch(`/admin/payment-webhooks${qs}`);

  const retry = async (id) => {
    setMsg("");
    try {
      await api.post(`/admin/payment-webhooks/${id}/retry`);
      setMsg(`Webhook #${id} re-queued for processing.`);
      await reload();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Payment webhooks</h1>
          <p className="mt-1 text-sm text-muted">Inspect incoming SSLCommerz / gateway IPN notifications and retry failed events.</p>
        </div>
        <select
          aria-label="Processing status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </select>
      </div>

      {msg && <p className="mt-4 text-sm text-primary">{msg}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !data.length ? (
          <div className="p-6"><Empty>No payment webhook events logged yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th>Provider</th>
                <th>Validation ID</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Received</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((w) => (
                <>
                  <tr key={w.id} className="hover:bg-primary/5">
                    <td className="px-5 py-3 font-mono text-xs">#{w.id}</td>
                    <td className="font-semibold text-primary">{titleCase(w.provider)}</td>
                    <td className="font-mono text-xs">{w.validation_id}</td>
                    <td><StatusBadge value={w.processing_status} /></td>
                    <td>{w.attempt_count}</td>
                    <td className="whitespace-nowrap">{formatDateTime(w.received_at)}</td>
                    <td className="space-x-3 whitespace-nowrap pr-5 text-right text-xs font-semibold">
                      <button onClick={() => setExpanded(expanded === w.id ? null : w.id)} className="text-primary underline">
                        {expanded === w.id ? "Hide JSON" : "Payload"}
                      </button>
                      {w.processing_status === "failed" && (
                        <button onClick={() => retry(w.id)} className="text-terracotta underline">Retry</button>
                      )}
                    </td>
                  </tr>
                  {expanded === w.id && (
                    <tr key={`${w.id}-details`} className="bg-background/60">
                      <td colSpan={7} className="px-5 py-4 text-xs">
                        {w.last_error && <p className="mb-2 font-semibold text-terracotta">Error: {w.last_error}</p>}
                        <pre className="max-h-60 overflow-auto rounded-xl border border-border bg-white p-3 font-mono text-[11px]">
                          {w.payload_json}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
}