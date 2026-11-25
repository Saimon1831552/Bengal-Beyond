"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/RemoteImage";
import Container from "@/components/ui/Container";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "./SectionHeader";
import TourQuickActions from "./TourQuickActions";
import { useLandingExploreStore } from "@/store/useLandingExploreStore";
import { formatPrice } from "@/lib/format";

export default function ShortTours({ tours }) {
  const recordRecent = useLandingExploreStore((s) => s.recordRecent);
  const [flipped, setFlipped] = useState({});

  if (!tours.length) return null;

  const toggleFlip = (slug) => setFlipped((prev) => ({ ...prev, [slug]: !prev[slug] }));

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeader eyebrow="Short tours" title="Popular short tours" subtitle="Two to three days, packed with the best of a region." />
        <Reveal stagger={0.12} className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {tours.slice(0, 6).map((t) => {
            const isFlipped = Boolean(flipped[t.slug]);
            return (
              <div key={t.slug} className="group relative h-[25rem] sm:h-[26rem] [perspective:1200px]">
                <div className="absolute right-4 top-4 z-20">
                  <TourQuickActions tour={t} />
                </div>
                <div
                  className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)] ${
                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  {/* Front */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl [backface-visibility:hidden]">
                    <Image src={t.image} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-gold">
                        <span>{t.days} days</span>
                        {t.price != null && <span>From {formatPrice(t.price, t.currency)}</span>}
                      </div>
                      <h3 className="mt-1 text-xl font-semibold sm:text-2xl">{t.title}</h3>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="hidden text-xs text-white/75 md:inline">Hover to see highlights</span>
                        <button
                          type="button"
                          onClick={() => toggleFlip(t.slug)}
                          className="rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md md:hidden"
                        >
                          Details ↻
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 flex flex-col rounded-3xl bg-primary p-6 pt-16 text-white sm:p-7 sm:pt-16 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gold">About this tour</p>
                      <button
                        type="button"
                        onClick={() => toggleFlip(t.slug)}
                        className="text-xs text-white/75 underline md:hidden"
                      >
                        Back ↺
                      </button>
                    </div>
                    <p className="mt-3 line-clamp-5 flex-1 text-sm leading-relaxed text-white/90">
                      {t.summary || "Open the tour page for the full details."}
                    </p>
                    {t.price != null && (
                      <p className="mb-3 text-sm font-semibold text-gold">Starting from {formatPrice(t.price, t.currency)}</p>
                    )}
                    <Link
                      href={t.href}
                      onClick={() => recordRecent(t)}
                      className="rounded-full bg-gold px-5 py-2.5 text-center text-sm font-semibold text-primary-dark"
                    >
                      View itinerary
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}