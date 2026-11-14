"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import AuthShell from "./AuthShell";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { errMsg } from "@/lib/errors";

export default function RegisterForm() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const [f, setF] = useState({ fullName: "", email: "", password: "", phone: "", nationality: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { if (status === "authenticated") router.replace("/dashboard"); }, [status, router]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await authService.register({ ...f, email: f.email.trim() });
      router.replace("/dashboard");
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create account" subtitle="Book tours and manage your trips in one place."
      footer={<>Already registered? <Link href="/sign-in" className="font-semibold text-primary link-underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required minLength={2} autoComplete="name" value={f.fullName} onChange={set("fullName")} />
        <Field label="Email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} />
        <Field label="Password" type="password" required minLength={12} autoComplete="new-password" hint="At least 12 characters." value={f.password} onChange={set("password")} />
        <Field label="Phone (optional)" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} />
        <Field label="Nationality (optional)" value={f.nationality} onChange={set("nationality")} />
        {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
        <button disabled={busy} className="btn-gold w-full rounded-full px-6 py-3 font-semibold disabled:opacity-60">{busy ? "Creating…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}