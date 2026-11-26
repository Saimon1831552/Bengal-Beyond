"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const HIDDEN_PREFIXES = [
  "/admin",
  "/sign-in",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const emptySubscribe = () => () => {};

function ConciergeIcon({ open }) {
  if (open) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M12 8v1m0 6v1m-3.5-4h1m5 0h1" />
    </svg>
  );
}

export default function FloatingConcierge({ phone = "" }) {
  const pathname = usePathname() || "";
  const triggerRef = useRef(null);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!mounted || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const cleanDigits = String(phone || "").replace(/[^\d]/g, "");
  const whatsappNumber = cleanDigits.length >= 10 ? cleanDigits : "8801700000000";
  const whatsappText = encodeURIComponent(
    form.message.trim() || "Hello Bengal Beyond! I'd like help planning a custom tour in Bangladesh."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await api.post("/support/enquiries", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        category: "tour",
        subject: "Tour Planner Concierge Inquiry",
        message: form.message.trim(),
      });
      const ref = res.data?.data?.ticketReference;
      setForm({ name: "", email: "", phone: "", message: "" });
      setStatus({
        type: "ok",
        text: ref
          ? `Inquiry received (Ref: ${ref}). Our tour planner will reply shortly.`
          : "Inquiry received! Our trip planner will reply shortly.",
      });
    } catch (err) {
      setStatus({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      id="bb-floating-concierge"
      style={{
        position: "fixed",
        right: "env(safe-area-inset-right, 0px)",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 2147483000,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {open && (
        <div
          id="bb-tour-planner-dialog"
          role="dialog"
          aria-modal="false"
          aria-label="Ask a Tour Planner"
          style={{
            pointerEvents: "auto",
            marginRight: "10px",
            width: "min(23rem, calc(100vw - 4.25rem))",
            maxHeight: "calc(100dvh - 2rem)",
            backgroundColor: "#ffffff",
            animation: "page-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
          className="overflow-y-auto rounded-3xl border border-border shadow-[0_24px_60px_-15px_rgba(8,43,33,0.48)]"
        >
          <div style={{ backgroundColor: "#123D32", color: "#ffffff" }} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  Dhaka Concierge Desk
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-white">
                  Plan Your Bengal Journey
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close tour planner"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
              >
                ×
              </button>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: "#25D366", color: "#082B21" }}
              className="mt-3 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition hover:brightness-105"
            >
              <span>Chat Instantly on WhatsApp</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <form onSubmit={submit} className="space-y-3 p-5 text-sm">
            <p className="text-xs text-muted">
              Or send a direct inquiry to our local tour planners:
            </p>
            <input
              type="text"
              required
              maxLength={160}
              placeholder="Your full name"
              aria-label="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-primary outline-none transition focus:border-[#123D32]"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="email"
                required
                maxLength={190}
                placeholder="Email address"
                aria-label="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-primary outline-none transition focus:border-[#123D32]"
              />
              <input
                type="tel"
                maxLength={40}
                placeholder="Phone / WhatsApp"
                aria-label="Phone or WhatsApp"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-primary outline-none transition focus:border-[#123D32]"
              />
            </div>
            <textarea
              required
              rows={3}
              maxLength={2000}
              placeholder="Dates, group size, or places you want to visit (e.g., Sundarbans + Sylhet)…"
              aria-label="Trip details"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-primary outline-none transition focus:border-[#123D32]"
            />
            {status.text && (
              <p
                role={status.type === "error" ? "alert" : "status"}
                className={`text-xs ${
                  status.type === "error" ? "text-terracotta" : "font-medium text-[#123D32]"
                }`}
              >
                {status.text}
              </p>
            )}
            <button
              disabled={busy}
              className="btn-gold w-full rounded-full py-2.5 text-xs font-semibold disabled:opacity-50"
            >
              {busy ? "Sending inquiry…" : "Send Trip Inquiry"}
            </button>
          </form>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="bb-tour-planner-dialog"
        aria-label={open ? "Close Ask a Tour Planner" : "Ask a Tour Planner"}
        style={{
          pointerEvents: "auto",
          backgroundColor: "#123D32",
          color: "#ffffff",
          borderTopLeftRadius: "16px",
          borderBottomLeftRadius: "16px",
          borderTopRightRadius: "0px",
          borderBottomRightRadius: "0px",
          borderLeft: "1.5px solid rgba(232, 169, 60, 0.75)",
          borderTop: "1.5px solid rgba(232, 169, 60, 0.75)",
          borderBottom: "1.5px solid rgba(232, 169, 60, 0.75)",
          borderRight: "none",
          boxShadow: "-6px 10px 28px -4px rgba(8, 43, 33, 0.55)",
        }}
        className="group relative flex flex-col items-center gap-2.5 px-2.5 py-3.5 transition-all duration-300 hover:bg-[#0E3128] hover:pr-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-3 sm:py-4"
      >
        <span
          style={{ backgroundColor: "rgba(232, 169, 60, 0.18)", color: "#E8A93C" }}
          className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors duration-300 group-hover:bg-gold group-hover:text-[#123D32]"
        >
          <ConciergeIcon open={open} />
          {!open && (
            <span
              aria-hidden="true"
              style={{ backgroundColor: "#25D366" }}
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[#123D32]"
            />
          )}
        </span>

        <span
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
          }}
          className="select-none whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-white sm:text-xs"
        >
          {open ? "Close" : "Ask a Tour Planner"}
        </span>
      </button>
    </div>,
    document.body
  );
}