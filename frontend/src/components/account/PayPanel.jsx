"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import useCountdown from "@/hooks/useCountdown";
import { money } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const slot = (id, opt) => `bb_pay_key_${id}_${opt}`;
const fresh = () => crypto.randomUUID();
function getKey(id, opt) {
  try {
    let k = sessionStorage.getItem(slot(id, opt));
    if (!k) { k = fresh(); sessionStorage.setItem(slot(id, opt), k); }
    return k;
  } catch { return fresh(); }
}
function rotateKey(id, opt) {
  const k = fresh();
  try { sessionStorage.setItem(slot(id, opt), k); } catch {}
  return k;
}

export default function PayPanel({ booking: b, reload }) {
  const { text, expired } = useCountdown(b.expires_at);
  const [code, setCode] = useState("");
  const [paymentOption, setPaymentOption] = useState("full"); // "full" | "partial"
  const [partialAmount, setPartialAmount] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const totalAmount = Number(b.total_amount || 0);
  const paidAmount = Number(b.paid_amount || 0);
  const remainingAmount = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));
  const minPartialAmount = Math.min(remainingAmount, Math.max(10, Number((Math.ceil(totalAmount * 30) / 100).toFixed(2))));

  useEffect(() => {
    setPartialAmount(minPartialAmount.toFixed(2));
  }, [minPartialAmount]);

  const open = ["pending_review", "awaiting_payment", "confirmed"].includes(b.booking_status);
  const payable = ["unpaid", "failed", "pending", "partially_paid"].includes(b.payment_status) && remainingAmount > 0;
  if (!open || !payable) return null;

  const hasCoupon = Number(b.discount_amount) > Number(b.member_discount_amount || 0);
  const notBdt = b.currency_code !== "BDT";
  const canPartial = remainingAmount > minPartialAmount && paidAmount === 0;

  const run = async (name, fn) => {
    setBusy(name); setMsg({ type: "", text: "" });
    try { await fn(); } catch (e) { setMsg({ type: "error", text: errMsg(e) }); } finally { setBusy(""); }
  };

  const applyCoupon = (e) => {
    e.preventDefault();
    run("coupon", async () => {
      await api.post(`/bookings/${b.id}/coupon`, { code: code.trim() });
      setCode(""); setMsg({ type: "ok", text: "Coupon applied." }); await reload();
    });
  };
  const removeCoupon = () => run("coupon", async () => {
    await api.delete(`/bookings/${b.id}/coupon`); setMsg({ type: "ok", text: "Coupon removed." }); await reload();
  });

  const pay = () => run("pay", async () => {
    const activeOption = canPartial ? paymentOption : "full";
    const bodyFor = (key) => ({
      idempotency_key: key,
      payment_option: activeOption,
      ...(activeOption === "partial" ? { amount: Number(partialAmount) } : {}),
    });
    const post = (key) => api.post(`/customer/bookings/${b.id}/payments/sslcommerz`, bodyFor(key));
    let res;
    try { res = await post(getKey(b.id, activeOption)); }
    catch (e) {
      if (e.response?.status === 409 && /no reusable checkout/i.test(errMsg(e))) {
        res = await post(rotateKey(b.id, activeOption));
      } else {
        throw e;
      }
    }
    const d = res.data?.data || {};
    const url = d.gateway_url || d.gatewayPageURL;
    let ok = false;
    try { const u = new URL(url); ok = u.protocol === "https:" && u.hostname.endsWith("sslcommerz.com"); } catch {}
    if (!ok) throw new Error("The payment gateway returned an unexpected address.");
    window.location.assign(url);
  });

  const payableNow = canPartial && paymentOption === "partial" ? Number(partialAmount || minPartialAmount) : remainingAmount;

  return (
    <section className="mt-6 rounded-3xl border border-gold/50 bg-gold/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl text-primary">
          {b.payment_status === "partially_paid" ? "Pay remaining balance" : "Complete your payment"}
        </h2>
        {text && paidAmount === 0 && (
          <p className={`rounded-full px-4 py-1 text-sm font-semibold ${expired ? "bg-terracotta/15 text-terracotta" : "bg-white text-primary"}`} role="timer">
            {expired ? "Seat hold expired" : `Seats held for ${text}`}
          </p>
        )}
      </div>

      {expired && paidAmount === 0 && b.booking_status !== "confirmed" ? (
        <p className="mt-4 text-sm text-primary-dark">Your hold has expired, so these seats may have been released. Please start a new booking.</p>
      ) : (
        <>
          {paidAmount === 0 && b.booking_status !== "confirmed" && (
            <form onSubmit={applyCoupon} className="mt-5 flex flex-wrap items-end gap-3">
              <label className="text-sm font-medium">Coupon code
                <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} autoCapitalize="characters"
                  className="mt-1 block w-48 rounded-xl border border-border bg-white px-4 py-2.5 uppercase outline-none focus:border-accent" />
              </label>
              <button disabled={!code.trim() || busy === "coupon"} className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary disabled:opacity-40">
                Apply
              </button>
              {hasCoupon && (
                <button type="button" onClick={removeCoupon} disabled={busy === "coupon"} className="text-sm font-semibold text-terracotta underline">
                  Remove coupon
                </button>
              )}
            </form>
          )}

          {canPartial && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment option">
              <label className={`cursor-pointer rounded-2xl border bg-white p-4 transition ${paymentOption === "full" ? "border-accent ring-2 ring-accent/30" : "border-border"}`}>
                <input type="radio" name="payOption" className="sr-only" checked={paymentOption === "full"} onChange={() => setPaymentOption("full")} />
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Option 1</p>
                <p className="mt-1 font-semibold text-primary">Pay Full Bill</p>
                <p className="mt-1 text-sm text-muted">Settle 100% now ({money(remainingAmount, b.currency_code)})</p>
              </label>

              <label className={`cursor-pointer rounded-2xl border bg-white p-4 transition ${paymentOption === "partial" ? "border-accent ring-2 ring-accent/30" : "border-border"}`}>
                <input type="radio" name="payOption" className="sr-only" checked={paymentOption === "partial"} onChange={() => setPaymentOption("partial")} />
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Option 2</p>
                <p className="mt-1 font-semibold text-primary">Partial Payment (Deposit)</p>
                <p className="mt-1 text-sm text-muted">Pay at least 30% ({money(minPartialAmount, b.currency_code)}) now and the rest later</p>
              </label>
            </div>
          )}

          {canPartial && paymentOption === "partial" && (
            <div className="mt-4 rounded-2xl border border-border bg-white p-4">
              <label className="block text-sm font-medium text-primary">
                Partial payment amount ({b.currency_code})
                <input
                  type="number"
                  step="0.01"
                  min={minPartialAmount}
                  max={remainingAmount}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="mt-1.5 block w-52 rounded-xl border border-border px-4 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <p className="mt-1 text-xs text-muted">
                Minimum {money(minPartialAmount, b.currency_code)} · Remaining balance after this payment:{" "}
                <strong>{money(Math.max(0, remainingAmount - Number(partialAmount || 0)), b.currency_code)}</strong>
              </p>
            </div>
          )}

          {notBdt && <p className="mt-4 text-sm text-terracotta">Online payment is available for BDT bookings only. Please contact us to pay.</p>}
          {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`mt-3 text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gold/40 pt-4">
            <div className="space-y-0.5 text-sm">
              <p className="text-muted">Total bill: {money(totalAmount, b.currency_code)} {paidAmount > 0 && `· Paid: ${money(paidAmount, b.currency_code)}`}</p>
              <p className="text-lg font-semibold text-primary">Pay now: {money(payableNow, b.currency_code)}</p>
            </div>
            <button onClick={pay} disabled={busy === "pay" || notBdt} data-burst
              className="btn-gold rounded-full px-8 py-3 font-semibold disabled:opacity-60">
              {busy === "pay" ? "Redirecting…" : canPartial && paymentOption === "partial" ? "Pay partial deposit" : "Pay full bill"}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">You&apos;ll be redirected to SSLCommerz. We never see your card or mobile-banking details.</p>
        </>
      )}
    </section>
  );
}