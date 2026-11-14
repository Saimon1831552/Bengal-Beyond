"use client";
import { useState } from "react";
import api from "@/lib/axios";
import useCountdown from "@/hooks/useCountdown";
import { money } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const slot = (id) => `bb_pay_key_${id}`;
const fresh = () => crypto.randomUUID();
function getKey(id) {
  try {
    let k = sessionStorage.getItem(slot(id));
    if (!k) { k = fresh(); sessionStorage.setItem(slot(id), k); }
    return k;
  } catch { return fresh(); }
}
function rotateKey(id) {
  const k = fresh();
  try { sessionStorage.setItem(slot(id), k); } catch {}
  return k;
}

export default function PayPanel({ booking: b, reload }) {
  const { text, expired } = useCountdown(b.expires_at);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const open = ["pending_review", "awaiting_payment"].includes(b.booking_status);
  const payable = ["unpaid", "failed", "pending"].includes(b.payment_status);
  if (!open || !payable) return null;

  const hasCoupon = Number(b.discount_amount) > 0;
  const notBdt = b.currency_code !== "BDT";

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
    const post = (key) => api.post(`/customer/bookings/${b.id}/payments/sslcommerz`, { idempotency_key: key });
    let res;
    try { res = await post(getKey(b.id)); }
    catch (e) {
      // A finished/failed attempt keeps its key but has no reusable URL: start a new attempt
      if (e.response?.status === 409 && /no reusable checkout/i.test(errMsg(e))) res = await post(rotateKey(b.id));
      else throw e;
    }
    const d = res.data?.data || {};
    const url = d.gateway_url || d.gatewayPageURL;
    let ok = false;
    try { const u = new URL(url); ok = u.protocol === "https:" && u.hostname.endsWith("sslcommerz.com"); } catch {}
    if (!ok) throw new Error("The payment gateway returned an unexpected address.");
    window.location.assign(url);
  });

  return (
    <section className="mt-6 rounded-3xl border border-gold/50 bg-gold/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl text-primary">Complete your payment</h2>
        {text && (
          <p className={`rounded-full px-4 py-1 text-sm font-semibold ${expired ? "bg-terracotta/15 text-terracotta" : "bg-white text-primary"}`} role="timer">
            {expired ? "Seat hold expired" : `Seats held for ${text}`}
          </p>
        )}
      </div>

      {expired ? (
        <p className="mt-4 text-sm text-primary-dark">Your hold has expired, so these seats may have been released. Please start a new booking.</p>
      ) : (
        <>
          <form onSubmit={applyCoupon} className="mt-5 flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium">Coupon code
              <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} autoCapitalize="characters"
                className="mt-1 block w-48 rounded-xl border border-border bg-white px-4 py-2.5 uppercase outline-none focus:border-accent" />
            </label>
            <button disabled={!code.trim() || busy === "coupon"} className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary disabled:opacity-40">Apply</button>
            {hasCoupon && <button type="button" onClick={removeCoupon} disabled={busy === "coupon"} className="text-sm font-semibold text-terracotta underline">Remove coupon</button>}
          </form>

          {notBdt && <p className="mt-4 text-sm text-terracotta">Online payment is available for BDT bookings only. Please contact us to pay.</p>}
          {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`mt-3 text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-semibold text-primary">Total: {money(b.total_amount, b.currency_code)}</p>
            <button onClick={pay} disabled={busy === "pay" || notBdt} data-burst
              className="btn-gold rounded-full px-8 py-3 font-semibold disabled:opacity-60">
              {busy === "pay" ? "Redirecting…" : b.payment_status === "pending" ? "Continue to payment" : "Pay securely"}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">You&apos;ll be redirected to SSLCommerz. We never see your card or mobile-banking details.</p>
        </>
      )}
    </section>
  );
}