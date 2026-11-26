"use client";
import { useRef } from "react";
import Link from "next/link";
import Image from "@/components/ui/RemoteImage";
import Container from "@/components/ui/Container";
import SectionHeader from "./SectionHeader";
import TourQuickActions from "./TourQuickActions";
import { useLandingExploreStore } from "@/store/useLandingExploreStore";
import { formatPrice } from "@/lib/format";

export default function HolidayTours({ tours }) {
  const ref = useRef(null);
  const recordRecent = useLandingExploreStore((s) => s.recordRecent);
  const go = (d) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });

  if (!tours.length) return null;

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <SectionHeader center={false} eyebrow="Holiday tours" title="Popular holiday tours" />
          <div className="mb-12 flex gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                onClick={() => go(d)}
                aria-label={d < 0 ? "Previous" : "Next"}
                className="grid h-10 w-10 place-items-center rounded-full border border-primary text-primary transition-colors hover:bg-primary hover:text-white sm:h-11 sm:w-11"
              >
                {d < 0 ? "←" : "→"}
              </button>
            ))}
          </div>
        </div>
      </Container>

      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1rem,calc((100vw-72rem)/2))] pb-6 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tours.map((t) => (
          <div
            key={t.slug}
            className="group relative h-[27rem] w-[82vw] max-w-[20.5rem] shrink-0 snap-start overflow-hidden rounded-3xl sm:h-[30rem] sm:w-[19.5rem] lg:w-[20.5rem]"
          >
            <div className="absolute right-4 top-4 z-20">
              <TourQuickActions tour={t} />
            </div>
            <Link href={t.href} onClick={() => recordRecent(t)} className="block h-full w-full">
              <Image src={t.image} alt="" fill sizes="(max-width:640px) 82vw, 328px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/45" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                {t.destination && <p className="text-xs font-semibold uppercase tracking-widest text-white">{t.destination}</p>}
                <h3 className="mt-1 text-xl text-gold font-semibold sm:text-2xl">{t.title}</h3>
                <div className="grid grid-rows-[1fr] transition-all duration-500 md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] md:group-focus-visible:grid-rows-[1fr] pointer-coarse:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="mt-2.5 line-clamp-2 text-xs text-white/85 sm:mt-3 sm:text-sm">{t.summary}</p>
                    <div className="mt-3.5 flex items-center justify-between text-xs sm:mt-4 sm:text-sm">
                      <span>{t.days} days</span>
                      {t.price != null && <span className="font-semibold text-gold">From {formatPrice(t.price, t.currency)}</span>}
                    </div>
                    <span className="mt-3.5 inline-block rounded-full bg-gold px-5 py-2 text-xs font-semibold text-primary-dark sm:mt-4 sm:text-sm">
                      View Tour
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}