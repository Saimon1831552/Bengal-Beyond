"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAccessStore } from "@/store/useAccessStore";
import { loadAccess } from "@/lib/access";
import { refreshSession } from "@/lib/axios";
import { hasSessionHint, SESSION_KEY } from "@/lib/session";

export default function AuthProvider({ children }) {
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    // Remove tokens left in localStorage by the old implementation
    try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch {}

    const { clearAuth } = useAuthStore.getState();
    if (hasSessionHint()) {
      refreshSession().catch(() => clearAuth()); // single-flight: safe under Strict Mode
    } else {
      clearAuth();
    }

    // Logged out in another tab -> log out here too
    const onStorage = (e) => {
      if (e.key === SESSION_KEY && e.newValue !== "1") useAuthStore.getState().clearAuth();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const acc = useAccessStore.getState();
    if (authStatus === "authenticated" && acc.status === "idle") loadAccess();
    if (authStatus === "guest") acc.reset();
  }, [authStatus]);

  return children;
}