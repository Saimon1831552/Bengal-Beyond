"use client";
import { useState } from "react";
import Link from "next/link";
import Field from "@/components/ui/Field";
import AuthShell from "./AuthShell";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await api.post("/auth/request-password-reset", { email: email.trim() }); setDone(true); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a reset link, valid for 30 minutes."
      footer={<Link href="/sign-in" className="font-semibold text-primary link-underline">Back to sign in</Link>}>
      {done ? (
        <p role="status" className="rounded-xl bg-accent/10 p-4 text-sm text-primary">
          If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
          <button disabled={busy} className="btn-gold w-full rounded-full px-6 py-3 font-semibold disabled:opacity-60">{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
    </AuthShell>
  );
}