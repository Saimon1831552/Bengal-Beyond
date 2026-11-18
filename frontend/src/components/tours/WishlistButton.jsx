"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

export default function WishlistButton({ tourId, slug }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    api.get(`/me/wishlist/${tourId}/status`).then((r) => setSaved(!!r.data?.data?.contains)).catch(() => {});
  }, [status, tourId]);

  const toggle = async () => {
    if (status !== "authenticated") return router.push(`/sign-in?next=${encodeURIComponent(`/tours/${slug}`)}`);
    setBusy(true);
    try {
      if (saved) await api.delete(`/me/wishlist/${tourId}`); else await api.post(`/me/wishlist/${tourId}`);
      setSaved(!saved);
    } catch { /* leave the state as it was */ } finally { setBusy(false); }
  };

  return (
    <button onClick={toggle} disabled={busy} aria-pressed={saved}
      className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-60">
      {saved ? "♥ Saved" : "♡ Save for later"}
    </button>
  );
}