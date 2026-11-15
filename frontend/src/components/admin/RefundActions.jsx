"use client";
import { useState } from "react";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

export default function RefundActions({ refund: r, provider, onDone }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const base = `/admin/refunds/${r.id}`;

  const run = async (name, fn, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(name); setMsg("");
    try { await fn(); await onDone(); } catch (e) { setMsg(errMsg(e)); } finally { setBusy(""); }
  };
  const b = "text-xs font-semibold underline disabled:opacity-40";

  if (!["requested", "pending"].includes(r.status)) return null;
  return (
    <div className="space-y-1 text-right">
      <div className="flex flex-wrap justify-end gap-3">
        {r.status === "requested" && provider === "sslcommerz" && (
          <button className={`${b} text-primary`} disabled={!!busy}
            onClick={() => run("submit", () => api.post(`${base}/sslcommerz/submit`), "Send this refund to SSLCommerz now? It cannot be sent twice.")}>
            {busy === "submit" ? "Sending…" : "Submit to SSLCommerz"}
          </button>
        )}
        {r.status === "pending" && (
          <button className={`${b} text-primary`} disabled={!!busy} onClick={() => run("check", () => api.post(`${base}/sslcommerz/reconcile`))}>
            {busy === "check" ? "Checking…" : "Check status"}
          </button>
        )}
        <button className={`${b} text-primary`} disabled={!!busy}
          onClick={() => run("done", () => api.patch(base, { status: "succeeded" }), "Mark as refunded WITHOUT asking the gateway? Only do this if you already refunded it in the SSLCommerz merchant panel.")}>
          Mark refunded
        </button>
        {r.status === "requested" && (
          <button className={`${b} text-terracotta`} disabled={!!busy} onClick={() => run("cancel", () => api.patch(base, { status: "cancelled" }), "Cancel this refund request?")}>Cancel</button>
        )}
      </div>
      {msg && <p role="alert" className="max-w-xs text-xs text-terracotta">{msg}</p>}
    </div>
  );
}