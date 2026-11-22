"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money, formatDate, titleCase } from "@/lib/format";

const STATUSES = ["new", "assigned", "in_progress", "awaiting_customer", "converted", "closed", "rejected"];

export default function AdminCustomEnquiries() {
  const [status, setStatus] = useState("");
  const { data: staff } = useFetch("/admin/guides");
  const qs = status ? `?status=${status}` : "";
  const { data, error, loading, reload } = useFetch(`/admin/custom-enquiries${qs}`);

  const updateEnquiry = async (id, patch) => {
    await api.patch(`/admin/custom-enquiries/${id}`, patch);
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Custom tour enquiries</h1>
          <p className="mt-1 text-sm text-muted">Bespoke trip requests submitted by travelers—assign coordinators and track status.</p>
        </div>
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> : !data.length ? <Empty>No custom tour enquiries found.</Empty> : data.map((e) => (
          <article key={e.id} className="rounded-2xl border border-border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted">#{e.id}</span>
                  <h2 className="text-lg font-semibold text-primary">{e.name}</h2>
                  <StatusBadge value={e.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {e.email}{e.phone ? ` · ${e.phone}` : ""} · Submitted {formatDate(e.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-primary">
                  {e.destination && <span>Destination: <strong>{e.destination}</strong></span>}
                  {e.preferred_start_date && <span>Dates: <strong>{formatDate(e.preferred_start_date)}{e.preferred_end_date ? ` → ${formatDate(e.preferred_end_date)}` : ""}</strong></span>}
                  {e.traveler_count && <span>Travelers: <strong>{e.traveler_count} pax</strong></span>}
                  {e.budget_amount != null && <span>Budget: <strong>{money(e.budget_amount, e.currency_code)}</strong></span>}
                </div>
                <p className="mt-3 whitespace-pre-line rounded-xl bg-background p-3 text-sm text-primary">{e.message}</p>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <label className="font-semibold">
                  Status
                  <select
                    value={e.status}
                    onChange={(ev) => updateEnquiry(e.id, { status: ev.target.value })}
                    className="mt-1 block w-44 rounded-xl border border-border bg-white px-3 py-1.5 text-xs"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                  </select>
                </label>

                <label className="font-semibold">
                  Assigned coordinator
                  <select
                    value={e.assigned_to || ""}
                    onChange={(ev) => updateEnquiry(e.id, { assigned_to: ev.target.value || null })}
                    className="mt-1 block w-44 rounded-xl border border-border bg-white px-3 py-1.5 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {(staff || []).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}