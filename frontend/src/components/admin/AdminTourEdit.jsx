"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "@/components/account/State";
import TourForm from "./TourForm";
import DepartureManager from "./DepartureManager";
import { useCan } from "./AdminShell";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUSES = ["draft", "published", "unpublished", "archived"];

export default function AdminTourEdit({ id }) {
  const router = useRouter();
  const can = useCan();
  const { data: t, error, loading, reload } = useFetch(`/admin/tours/${encodeURIComponent(id)}`);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const setStatus = async (status) => {
    setBusy(status); setMsg("");
    try { await api.patch(`/admin/tours/${t.id}/status`, { status }); await reload(); }
    catch (e) { setMsg(errMsg(e)); } finally { setBusy(""); }
  };
  const remove = async () => {
    if (!window.confirm("Delete this tour? It disappears from the site. Existing bookings are kept.")) return;
    setBusy("delete");
    try { await api.delete(`/admin/tours/${t.id}`); router.push("/admin/tours"); }
    catch (e) { setMsg(errMsg(e)); setBusy(""); }
  };

  return (
    <Container as="main" className="max-w-4xl space-y-8 py-8">
      <Link href="/admin/tours" className="text-sm text-accent link-underline">← All tours</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-primary">{t.title}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge value={t.status} />
          {t.status === "published" && <Link href={`/tours/${t.slug}`} target="_blank" className="text-sm font-semibold text-accent underline">View on site ↗</Link>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <span className="text-sm font-medium">Status:</span>
        {STATUSES.filter((s) => s !== t.status).map((s) => (
          <button key={s} onClick={() => setStatus(s)} disabled={!!busy}
            className={`rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 ${s === "published" ? "btn-gold" : "border border-primary text-primary"}`}>
            {busy === s ? "…" : s === "published" ? "Publish" : titleCase(s)}
          </button>
        ))}
        {msg && <p role="alert" className="w-full text-sm text-terracotta">{msg}</p>}
      </div>

      <TourForm key={t.updated_at} tour={t} onSaved={reload} />

      {can("departures.manage")
        ? <DepartureManager tourId={t.id} currency={t.currency_code} basePrice={t.base_price} />
        : <p className="text-sm text-muted">You don&apos;t have permission to manage departures.</p>}

      <div className="border-t border-border pt-6">
        <button onClick={remove} disabled={!!busy} className="text-sm font-semibold text-terracotta underline">Delete this tour</button>
      </div>
    </Container>
  );
}