"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "@/components/ui/RemoteImage";
import Container from "@/components/ui/Container";
import { useLandingExploreStore } from "@/store/useLandingExploreStore";
import { formatPrice } from "@/lib/format";

export default function RecentlyViewedSection() {
  const { hydrate, recentTours, clearRecent } = useLandingExploreStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!recentTours.length) return null;

  return (
    <section className="border-y border-border bg-white py-14">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">Pick up where you left off</p>
            <h2 className="mt-1 text-2xl font-semibold text-primary md:text-3xl">Recently viewed tours</h2>
          </div>
          <button
            type="button"
            onClick={clearRecent}
            className="text-xs font-semibold text-muted underline hover:text-primary"
          >
            Clear history
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recentTours.slice(0, 3).map((t) => (
            <Link
              key={t.slug}
              href={t.href || `/tours/${t.slug}`}
              className="group lift flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-3.5"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image src={t.image} alt="" fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-primary">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {t.days} {t.days === 1 ? "day" : "days"}{t.destination ? ` · ${t.destination}` : ""}
                </p>
                {t.price != null && (
                  <p className="mt-1 text-xs font-semibold text-terracotta">
                    From {formatPrice(t.price, t.currency)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}