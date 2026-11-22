"use client";
import { useState } from "react";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/public/newsletter", { email });
      setEmail("");
      setMsg({ type: "ok", text: "Subscribed! Look out for seasonal Bengal expeditions." });
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gold">Seasonal Dispatches</p>
      <p className="mt-1 text-xs text-white/80">Get early access to Sundarbans &amp; Sylhet departure dates.</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none"
        />
        <button
          disabled={busy}
          className="btn-gold shrink-0 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {busy ? "…" : "Join"}
        </button>
      </form>
      {msg.text && (
        <p className={`mt-2 text-xs ${msg.type === "error" ? "text-terracotta" : "text-gold"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}