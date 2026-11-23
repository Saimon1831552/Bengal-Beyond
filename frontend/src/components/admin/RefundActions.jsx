"use client";
import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

export default function RefundActions({ refund: r, provider, onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const base = `/admin/refunds/${r.id}`;

  const exec = async (name, fn, okText) => {
    setBusy(name);
    try {
      await fn();
      toast.success(okText);
      await onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  const ask = (name, title, description, confirmLabel, tone, fn, okText) => {
    setConfirmState({ title, description, confirmLabel, tone, run: () => exec(name, fn, okText) });
  };

  const b = "text-xs font-semibold underline disabled:opacity-40";
  if (!["requested", "pending"].includes(r.status)) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {r.status === "requested" && provider === "sslcommerz" && (
        <button
          className={`${b} text-primary`}
          disabled={!!busy}
          onClick={() =>
            ask(
              "submit",
              "Submit refund to SSLCommerz?",
              "Send this refund to SSLCommerz now? It cannot be sent twice.",
              "Submit to SSLCommerz",
              "primary",
              () => api.post(`${base}/sslcommerz/submit`),
              "Refund submitted to SSLCommerz."
            )
          }
        >
          {busy === "submit" ? "Sending…" : "Submit to SSLCommerz"}
        </button>
      )}
      {r.status === "pending" && (
        <button
          className={`${b} text-primary`}
          disabled={!!busy}
          onClick={() => exec("check", () => api.post(`${base}/sslcommerz/reconcile`), "Refund status reconciled.")}
        >
          {busy === "check" ? "Checking…" : "Check status"}
        </button>
      )}
      <button
        className={`${b} text-primary`}
        disabled={!!busy}
        onClick={() =>
          ask(
            "done",
            "Mark as refunded manually?",
            "Mark as refunded WITHOUT asking the gateway? Only do this if you already refunded it in the SSLCommerz merchant panel.",
            "Mark refunded",
            "primary",
            () => api.patch(base, { status: "succeeded" }),
            "Refund marked as succeeded."
          )
        }
      >
        Mark refunded
      </button>
      {r.status === "requested" && (
        <button
          className={`${b} text-terracotta`}
          disabled={!!busy}
          onClick={() =>
            ask(
              "cancel",
              "Cancel refund request?",
              "Cancel this refund request?",
              "Cancel refund",
              "danger",
              () => api.patch(base, { status: "cancelled" }),
              "Refund request cancelled."
            )
          }
        >
          Cancel
        </button>
      )}

      <ConfirmModal
        open={Boolean(confirmState)}
        tone={confirmState?.tone || "primary"}
        title={confirmState?.title}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel || "Confirm"}
        busy={Boolean(busy)}
        onConfirm={async () => {
          const fn = confirmState?.run;
          setConfirmState(null);
          if (fn) await fn();
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}