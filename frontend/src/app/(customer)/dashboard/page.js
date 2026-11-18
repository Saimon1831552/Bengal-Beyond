"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { money, formatDate } from "@/lib/format";
import { errMsg } from "@/lib/errors";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, error, loading, reload } = useFetch("/customer/bookings?limit=50");
  const [mail, setMail] = useState("");

  const resend = async () => {
    try { await api.post("/auth/request-verification", { email: user.email }); setMail("Verification email sent."); }
    catch (e) { setMail(errMsg(e)); }
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Welcome, {(user?.fullName || "traveller").split(" ")[0]}</h1>

      {data && (() => {
        const items = data.items;
        const open = (b) => ["pending_review", "awaiting_payment"].includes(b.booking_status);
        const stats = [
          ["Total bookings", data.pagination.total],
          ["Confirmed", items.filter((b) => b.booking_status === "confirmed").length],
          ["Awaiting payment", items.filter((b) => open(b) && ["unpaid", "failed", "pending"].includes(b.payment_status)).length],
        ];
        return (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {stats.map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">{l}</p>
                <p className="mt-2 font-display text-3xl font-semibold text-primary">{v}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {user && !user.emailVerifiedAt && (
        <div className="mt-6 rounded-2xl border border-gold/50 bg-gold/15 p-4 text-sm text-primary-dark">
          Your email isn&apos;t verified yet.{" "}
          <button onClick={resend} className="font-semibold underline">Send verification email</button>
          {mail && <span role="status" className="ml-2">{mail}</span>}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl text-primary">Recent bookings</h2>
        <Link href="/bookings" className="text-sm font-semibold text-accent link-underline">View all</Link>
      </div>
      <div className="mt-4 space-y-3">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> :
          !data.items.length ? <Empty>No bookings yet. <Link href="/tours" className="font-semibold text-primary underline">Browse tours</Link></Empty> :
          data.items.slice(0, 3).map((b) => (
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
    </Container>
  );
}