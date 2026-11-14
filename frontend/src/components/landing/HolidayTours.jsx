"use client";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeader from "./SectionHeader";
import { formatPrice } from "@/lib/format";

export default function HolidayTours({ tours }) {
  const ref = useRef(null);
  const go = (d) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });

  return (
    <section className="py-24">
      <Container>
        <div className="flex items-end justify-between">
          <SectionHeader center={false} eyebrow="Holiday tours" title="Popular holiday tours" />
          <div className="mb-12 hidden gap-2 sm:flex">
            {[-1, 1].map((d) => (
              <button key={d} onClick={() => go(d)} aria-label={d < 0 ? "Previous" : "Next"} className="grid h-11 w-11 place-items-center rounded-full border border-primary text-primary transition-colors hover:bg-primary hover:text-white">
                {d < 0 ? "←" : "→"}
              </button>
            ))}
          </div>
        </div>
      </Container>

      <div ref={ref} className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1rem,calc((100vw-72rem)/2))] pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tours.map((t) => (
          <Link key={t.slug} href={t.href} data-cursor="View" className="group relative h-[30rem] w-[19rem] shrink-0 snap-start overflow-hidden rounded-3xl">
            <Image src={t.image} alt="" fill sizes="304px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/45" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <h3 className="text-2xl font-semibold">{t.title}</h3>
              <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] pointer-coarse:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="mt-3 text-sm text-white/85">{t.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>{t.days} days</span>
                    {t.price != null && <span className="font-semibold text-gold">From {formatPrice(t.price, t.currency)}</span>}
                  </div>
                  <span className="mt-4 inline-block rounded-full bg-gold px-5 py-2 text-sm font-semibold text-primary-dark">View Tour</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}