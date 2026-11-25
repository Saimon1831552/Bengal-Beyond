"use client";
import Link from "next/link";
import Image from "@/components/ui/RemoteImage";
import Container from "@/components/ui/Container";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "./SectionHeader";
import TourQuickActions from "./TourQuickActions";
import { useLandingExploreStore } from "@/store/useLandingExploreStore";
import { formatPrice } from "@/lib/format";

export default function DayTours({ tours }) {
  const recordRecent = useLandingExploreStore((s) => s.recordRecent);
  if (!tours.length) return null;

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeader eyebrow="Day tours" title="Popular day tours" subtitle="Quick escapes, back by dinner." />
        <Reveal stagger={0.1} className="grid gap-5 pb-6 md:grid-cols-2 md:gap-6 md:pb-10">
          {tours.slice(0, 6).map((t, i) => (
            <div key={t.slug} className={i % 2 ? "md:translate-y-10" : ""}>
              <div className="group lift flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
                <Link href={t.href} onClick={() => recordRecent(t)} className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">
                    <Image src={t.image} alt="" fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-base font-semibold text-primary sm:text-lg">{t.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{t.summary}</p>
                    {t.price != null && (
                      <p className="mt-1.5 text-sm font-semibold text-terracotta">{formatPrice(t.price, t.currency)}</p>
                    )}
                  </div>
                </Link>
                <div className="flex justify-end border-t border-border/60 pt-2.5 sm:border-0 sm:pt-0">
                  <TourQuickActions tour={t} compact />
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}