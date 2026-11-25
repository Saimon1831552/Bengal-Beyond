"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "@/components/ui/RemoteImage";
import { AnimatePresence, motion } from "framer-motion";
import { useLandingExploreStore } from "@/store/useLandingExploreStore";
import { formatPrice } from "@/lib/format";

export default function TourCompareDock() {
  const {
    hydrate,
    compareList,
    compareOpen,
    setCompareOpen,
    toggleCompare,
    clearCompare,
  } = useLandingExploreStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!compareOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setCompareOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [compareOpen, setCompareOpen]);

  if (!compareList.length) return null;

  return (
    <>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed inset-x-3 bottom-20 z-40 rounded-2xl border border-gold/50 bg-primary-dark/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[calc(100vw-16rem)]"
      >
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-primary-dark">
              {compareList.length}/3
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-sand">
              Compare
            </span>
          </div>

          <div className="hidden items-center gap-1.5 md:flex">
            {compareList.map((t) => (
              <span
                key={t.slug}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs"
              >
                <span className="max-w-[8.5rem] truncate">{t.title}</span>
                <button
                  type="button"
                  onClick={() => toggleCompare(t)}
                  aria-label={`Remove ${t.title}`}
                  className="text-white/70 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              disabled={compareList.length < 2}
              className="btn-gold rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-45"
            >
              {compareList.length < 2 ? "Pick 1 more" : "Compare Now"}
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="text-xs text-white/70 underline hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {compareOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Compare selected tours"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCompareOpen(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 backdrop-blur-xs sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6 md:p-8"
            >
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-terracotta">Side-by-Side</p>
                  <h2 className="mt-1 text-xl font-semibold text-primary sm:text-2xl">Tour Comparison</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareOpen(false)}
                  aria-label="Close comparison"
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-xl text-primary hover:bg-background"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-32 pb-4 text-xs font-semibold uppercase tracking-wider text-muted sm:w-36">Feature</th>
                      {compareList.map((t) => (
                        <th key={t.slug} className="pb-4 pl-4 align-top">
                          <div className="relative h-32 w-full overflow-hidden rounded-2xl sm:h-36">
                            <Image src={t.image} alt="" fill sizes="280px" className="object-cover" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-primary sm:text-base">{t.title}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-3 font-medium text-muted">Duration</td>
                      {compareList.map((t) => (
                        <td key={t.slug} className="py-3 pl-4 font-semibold text-primary">
                          {t.days} {t.days === 1 ? "Day" : "Days"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-muted">Starting Price</td>
                      {compareList.map((t) => (
                        <td key={t.slug} className="py-3 pl-4 font-semibold text-terracotta">
                          {t.price != null ? formatPrice(t.price, t.currency) : "Contact for quote"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-muted">Destination</td>
                      {compareList.map((t) => (
                        <td key={t.slug} className="py-3 pl-4 text-primary">
                          {t.destination || "Bangladesh"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-muted">Style</td>
                      {compareList.map((t) => (
                        <td key={t.slug} className="py-3 pl-4 text-muted">
                          {t.categories?.length ? t.categories.join(", ") : t.category || "Guided Expedition"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 align-top font-medium text-muted">Overview</td>
                      {compareList.map((t) => (
                        <td key={t.slug} className="py-3 pl-4 align-top text-xs leading-relaxed text-muted">
                          {t.summary || "Full day-by-day itinerary available on the tour page."}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pt-5 font-medium text-muted">Action</td>
                      {compareList.map((t) => (
                        <td key={t.slug} className="pt-5 pl-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={t.href}
                              onClick={() => setCompareOpen(false)}
                              className="btn-gold rounded-full px-4 py-2 text-xs font-semibold"
                            >
                              View &amp; Book
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleCompare(t)}
                              className="rounded-full border border-border px-3 py-2 text-xs text-muted hover:text-primary"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}