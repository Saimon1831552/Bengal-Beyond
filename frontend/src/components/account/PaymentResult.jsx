"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import api from "@/lib/axios";
import { money } from "@/lib/format";

const copy = {
  succeeded: ["Payment confirmed", "Thank you! Your booking is paid. A confirmation will follow once our team reviews it."],
  pending: ["Confirming your payment…", "This usually takes a few seconds. You can safely leave this page."],
  initiated: ["Confirming your payment…", "This usually takes a few seconds. You can safely leave this page."],
  failed: ["Payment failed", "You have not been charged. You can try again from your booking."],
  cancelled: ["Payment cancelled", "No payment was taken. You can try again from your booking."],
};

export default function PaymentResult() {
  const hint = useSearchParams().get("status"); // informational only
  const [payment, setPayment] = useState(null);
  const [tries, setTries] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer;
    const check = async (n) => {
      try {
        const res = await api.get("/customer/payments?limit=1");
        const p = res.data?.data?.items?.[0] || null;
        if (!alive) return;
        setPayment(p); setTries(n);
        const unsettled = !p || ["initiated", "pending"].includes(p.status);
        if (unsettled && hint === "success" && n < 8) timer = setTimeout(() => check(n + 1), 3000);
      } catch { if (alive) setFailed(true); }
    };
    check(1);
    return () => { alive = false; clearTimeout(timer); };
  }, [hint]);

  const key = payment?.status || (hint === "failed" ? "failed" : hint === "cancelled" ? "cancelled" : "pending");
  const [title, text] = copy[key] || copy.pending;
  const stillWaiting = ["pending", "initiated"].includes(key) && hint === "success" && tries >= 8;

  return (
    <Container as="main" className="py-14">
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl text-primary">{title}</h1>
        <p className="mt-3 text-muted">{failed ? "We could not load your payment status. Check your payments page." : stillWaiting ? "We haven't received the bank's confirmation yet. Check your payments page shortly." : text}</p>
        {payment && (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <StatusBadge value={payment.status} /><span className="font-semibold text-primary">{money(payment.amount, payment.currency_code)}</span><span className="text-muted">{payment.booking_reference}</span>
          </div>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/bookings" className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">My bookings</Link>
          <Link href="/payments" className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary">Payments</Link>
        </div>
      </div>
    </Container>
  );
}