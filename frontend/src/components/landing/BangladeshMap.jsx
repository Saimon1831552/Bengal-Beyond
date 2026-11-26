"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeader from "./SectionHeader";
import { BANGLADESH_REGIONS, img } from "./data";
import { formatPrice } from "@/lib/format";

const BangladeshRealMapCanvas = dynamic(() => import("./BangladeshRealMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-80 w-full place-items-center rounded-2xl border border-white/15 bg-primary-dark/70 text-sm text-sand sm:h-100 lg:h-120">
      Loading interactive map of Bangladesh…
    </div>
  ),
});

export default function BangladeshMap({ destinations = [], tours = [] }) {
  const [selectedId, setSelectedId] = useState(BANGLADESH_REGIONS[0].id);

  const activeRegion = useMemo(
    () => BANGLADESH_REGIONS.find((r) => r.id === selectedId) || BANGLADESH_REGIONS[0],
    [selectedId]
  );

  const matchedDestination = useMemo(() => {
    const keys = activeRegion.keywords;
    return destinations.find((d) =>
      keys.some((k) => `${d.name} ${d.region || ""} ${d.slug}`.toLowerCase().includes(k))
    );
  }, [activeRegion, destinations]);

  const matchedTours = useMemo(() => {
    const keys = activeRegion.keywords;
    const direct = tours.filter((t) =>
      keys.some((k) => `${t.title} ${t.destination || ""} ${t.summary || ""}`.toLowerCase().includes(k))
    );
    return (direct.length ? direct : tours).slice(0, 2);
  }, [activeRegion, tours]);

  const exploreHref = matchedDestination
    ? `/destinations/${matchedDestination.slug}`
    : `/tours?q=${encodeURIComponent(activeRegion.name.split("&")[0].trim())}`;

  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24" id="explore-map">
      <Container>
        <SectionHeader
          eyebrow="Interactive Expedition Map"
          title="Explore Bangladesh by region"
          subtitle="Click any marker on the live map to fly to the region, check travel times from Dhaka, and browse matching departures."
        />

        <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.95fr] lg:gap-8">
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-primary-dark p-4 text-white shadow-2xl sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-sand/85">
              <span className="font-semibold uppercase tracking-widest text-gold">
                Live Map · {activeRegion.lat.toFixed(2)}°N, {activeRegion.lng.toFixed(2)}°E
              </span>
              <span>Click markers or pills to fly</span>
            </div>

            <BangladeshRealMapCanvas selectedId={selectedId} onSelect={setSelectedId} />

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible scrollbar-none [&::-webkit-scrollbar]:hidden">
              {BANGLADESH_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    r.id === activeRegion.id
                      ? "bg-gold font-semibold text-primary-dark shadow-md"
                      : "bg-white/10 text-white/85 hover:bg-white/20"
                  }`}
                >
                  {r.shortName}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeRegion.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-xl"
            >
              <div className="relative h-48 w-full shrink-0 sm:h-56">
                <Image
                  src={matchedDestination?.image || img(activeRegion.photoIndex, 1200)}
                  alt={activeRegion.name}
                  fill
                  sizes="(min-width:1024px) 45vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 text-white sm:bottom-5 sm:left-6 sm:right-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                    Best season: {activeRegion.bestSeason}
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold sm:text-3xl">{activeRegion.name}</h3>
                  <p className="mt-1 text-xs text-white/85 sm:text-sm">{activeRegion.tagline}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5 sm:p-7">
                <div>
                  <div className="rounded-2xl bg-background px-4 py-3 text-xs text-primary">
                    <strong>Getting there:</strong> {activeRegion.travelFromDhaka}
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {activeRegion.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <span className="font-bold text-terracotta">✦</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  {matchedTours.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Recommended Departures
                      </p>
                      <div className="mt-2.5 space-y-2">
                        {matchedTours.map((t) => (
                          <Link
                            key={t.slug}
                            href={`/tours/${t.slug}`}
                            className="flex items-center justify-between gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm transition hover:border-accent hover:bg-background/60"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-primary">{t.title}</p>
                              <p className="text-xs text-muted">{t.days} {t.days === 1 ? "day" : "days"}</p>
                            </div>
                            {t.price != null && (
                              <span className="shrink-0 font-semibold text-terracotta">
                                {formatPrice(t.price, t.currency || "BDT")} →
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={exploreHref} className="btn-gold rounded-full px-6 py-3 text-sm font-semibold">
                    Explore {activeRegion.shortName}
                  </Link>
                  <Link
                    href="/tours"
                    className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                  >
                    All Tours
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}