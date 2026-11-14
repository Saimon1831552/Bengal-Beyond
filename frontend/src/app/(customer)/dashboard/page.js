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
  const { data, error, loading, reload } = useFetch("/customer/bookings?limit=3");
  const [mail, setMail] = useState("");

  const resend = async () => {
    try { await api.post("/auth/request-verification", { email: user.email }); setMail("Verification email sent."); }
    catch (e) { setMail(errMsg(e)); }
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Welcome, {(user?.fullName || "traveller").split(" ")[0]}</h1>

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
    </Container>
  );
}