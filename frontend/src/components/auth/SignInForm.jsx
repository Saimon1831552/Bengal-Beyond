"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

// Only allow same-site relative paths (prevents open redirects)
const safeNext = (n) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

export default function SignInForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const status = useAuthStore((s) => s.status);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (status === "authenticated") router.replace(next); }, [status, next, router]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await authService.login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not sign in. Please try again.");
    } finally { setBusy(false); }
  };

  const input = "mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-accent";
  return (
    <form onSubmit={submit} className="mx-auto mt-10 w-full max-w-md space-y-4 rounded-3xl border border-border bg-white p-8 shadow-sm">
      <h1 className="text-3xl text-primary">Sign in</h1>
      <label className="block text-sm font-medium">Email
        <input type="email" required autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">Password
        <input type="password" required autoComplete="current-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
      <button disabled={busy} className="btn-gold w-full rounded-full px-6 py-3 font-semibold disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-primary link-underline">Forgot password?</Link>
        <Link href="/register" className="text-primary link-underline">Create account</Link>
      </div>
    </form>
  );
}