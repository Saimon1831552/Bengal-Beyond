"use client";
import { Fragment, useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUSES = ["", "received", "processing", "processed", "failed"];
const PAGE_SIZE = 20;

export default function AdminPaymentWebhooks() {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);

  const qs = status ? `?status=${status}` : "";
  const { data, error, loading, reload } = useFetch(`/admin/payment-webhooks${qs}`);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const rows = data || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const retry = async (id) => {
    try {
      await api.post(`/admin/payment-webhooks/${id}/retry`);
      toast.success(`Webhook #${id} re-queued for processing.`);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !rows.length ? (
          <div className="p-6"><Empty>No payment webhook events logged yet.</Empty></div>
        ) : (
          <>
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
                {pagedRows.map((w) => (
                  <Fragment key={w.id}>
                    <tr className="hover:bg-primary/5">
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
                      <tr className="bg-background/60">
                        <td colSpan={7} className="px-5 py-4 text-xs">
                          {w.last_error && <p className="mb-2 font-semibold text-terracotta">Error: {w.last_error}</p>}
                          <pre className="max-h-60 overflow-auto rounded-xl border border-border bg-white p-3 font-mono text-[11px]">
                            {w.payload_json}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} totalItems={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>
    </Container>
  );
}