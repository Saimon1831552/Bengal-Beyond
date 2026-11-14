"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell from "./AuthShell";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

export default function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState(token ? "loading" : "error");
  const [msg, setMsg] = useState(token ? "" : "This link is missing its token.");
  const started = useRef(false); // tokens are single-use; Strict Mode would run the effect twice

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api.post("/auth/verify-email", { token })
      .then(() => setState("ok"))
      .catch((e) => { setState("error"); setMsg(errMsg(e)); });
  }, [token]);

  return (
    <AuthShell title="Email verification">
      {state === "loading" && <p role="status" className="text-sm text-muted">Verifying…</p>}
      {state === "ok" && <p role="status" className="rounded-xl bg-accent/10 p-4 text-sm text-primary">Your email is verified. Thank you!</p>}
      {state === "error" && <p role="alert" className="text-sm text-terracotta">{msg} You can request a new link from your <Link href="/dashboard" className="font-semibold underline">dashboard</Link>.</p>}
    </AuthShell>
  );
}