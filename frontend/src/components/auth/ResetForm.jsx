"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Field from "@/components/ui/Field";
import AuthShell from "./AuthShell";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

export default function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true); setError("");
    try { await api.post("/auth/reset-password", { token, password }); setDone(true); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (!token) return <AuthShell title="Invalid link" footer={<Link href="/forgot-password" className="font-semibold text-primary">Request a new link</Link>}><p className="text-sm text-muted">This reset link is missing its token.</p></AuthShell>;

  return (
    <AuthShell title="Set a new password">
      {done ? (
        <div role="status" className="space-y-4 text-sm">
          <p className="rounded-xl bg-accent/10 p-4 text-primary">Password updated. All other devices were signed out.</p>
          <Link href="/sign-in" className="btn-gold inline-block rounded-full px-6 py-3 font-semibold">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" type="password" required minLength={12} autoComplete="new-password" hint="At least 12 characters." value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label="Confirm password" type="password" required minLength={12} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
          <button disabled={busy} className="btn-gold w-full rounded-full px-6 py-3 font-semibold disabled:opacity-60">{busy ? "Saving…" : "Update password"}</button>
        </form>
      )}
    </AuthShell>
  );
}