"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { money, formatDate } from "@/lib/format";

export default function BookingList() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch(`/customer/bookings?page=${page}&limit=10`);

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">My bookings</h1>
      <div className="mt-6 space-y-3">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> :
          !data.items.length ? <Empty>No bookings yet. <Link href="/tours" className="font-semibold text-primary underline">Browse tours</Link></Empty> :
          data.items.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`} className="lift flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-5">
              <div>
                <p className="font-semibold text-primary">{b.booking_reference}</p>
                <p className="text-sm text-muted">{formatDate(b.created_at)} · {b.traveler_count} traveller(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge value={b.booking_status} /><StatusBadge value={b.payment_status} />
                <span className="font-semibold text-primary">{money(b.total_amount, b.currency_code)}</span>
              </div>
            </Link>
          ))}
      </div>
      {data?.pagination?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40">Previous</button>
          <span>Page {page} of {data.pagination.totalPages}</span>
          <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 text-primary disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}