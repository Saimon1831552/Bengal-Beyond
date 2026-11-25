"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLandingExploreStore } from "@/store/useLandingExploreStore";
import { useToast } from "@/components/ui/ToastProvider";

export default function TourQuickActions({ tour, compact = false }) {
  const router = useRouter();
  const toast = useToast();
  const authStatus = useAuthStore((s) => s.status);
  const {
    hydrate,
    compareList,
    toggleCompare,
    wishlistIds,
    syncWishlist,
    toggleWishlist,
  } = useLandingExploreStore();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (authStatus === "authenticated") syncWishlist();
  }, [authStatus, syncWishlist]);

  const isSaved = tour?.id && wishlistIds.includes(Number(tour.id));
  const isCompared = compareList.some((x) => x.slug === tour.slug);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (authStatus !== "authenticated") {
      router.push(`/sign-in?next=${encodeURIComponent(tour.href || `/tours/${tour.slug}`)}`);
      return;
    }
    if (!tour?.id || busy) return;
    setBusy(true);
    try {
      const nowSaved = await toggleWishlist(tour.id);
      toast.success(nowSaved ? "Saved to your wishlist." : "Removed from wishlist.");
    } catch {
      toast.error("Could not update wishlist.");
    } finally {
      setBusy(false);
    }
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleCompare(tour);
    if (!res.ok && res.reason === "max") {
      toast.error("You can compare up to 3 tours at once.");
    } else if (res.added) {
      toast.success(`Added "${tour.title}" to comparison.`);
    }
  };

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {tour?.id && (
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          aria-pressed={Boolean(isSaved)}
          aria-label={isSaved ? "Remove from wishlist" : "Save tour to wishlist"}
          title={isSaved ? "Saved" : "Save tour"}
          className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition ${
            isSaved
              ? "bg-terracotta text-white shadow-md"
              : "bg-black/45 text-white hover:bg-black/70"
          }`}
        >
          {isSaved ? "♥" : "♡"}
        </button>
      )}
      <button
        type="button"
        onClick={handleCompare}
        aria-pressed={isCompared}
        aria-label={isCompared ? "Remove from tour comparison" : "Compare tour"}
        title={isCompared ? "In comparison" : "Compare"}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition ${
          isCompared
            ? "bg-gold text-primary-dark shadow-md"
            : "bg-black/45 text-white hover:bg-black/70"
        }`}
      >
        {compact ? (isCompared ? "✓" : "⇄") : isCompared ? "✓ Comparing" : "⇄ Compare"}
      </button>
    </div>
  );
}