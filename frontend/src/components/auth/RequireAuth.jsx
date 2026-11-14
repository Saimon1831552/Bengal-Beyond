"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function RequireAuth({ children }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      const here = window.location.pathname + window.location.search;
      router.replace(`/sign-in?next=${encodeURIComponent(here)}`);
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <div role="status" className="grid min-h-[60vh] place-items-center text-muted">Loading…</div>;
  }
  return children;
}