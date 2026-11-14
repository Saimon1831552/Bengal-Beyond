"use client";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money, formatDate } from "@/lib/format";

export default function PaymentList() {
  const { data, error, loading, reload } = useFetch("/customer/payments?limit=20");
  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Payments</h1>
      <div className="mt-6 space-y-3">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> :
          !data.items.length ? <Empty>No payments yet.</Empty> :
          data.items.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-5">
              <div>
                <p className="font-semibold text-primary">{p.booking_reference}</p>
                <p className="text-sm text-muted">{formatDate(p.created_at)} · {p.provider}</p>
              </div>
              <div className="flex items-center gap-3"><StatusBadge value={p.status} /><span className="font-semibold text-primary">{money(p.amount, p.currency_code)}</span></div>
            </div>
          ))}
      </div>
    </Container>
  );
}