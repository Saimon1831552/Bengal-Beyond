"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeader from "./SectionHeader";
import { gsap, prefersReduced } from "@/lib/gsap";
import { PLACES, img } from "./data";

export default function Heritage() {
  const root = useRef(null);
  useEffect(() => {
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      const wraps = gsap.utils.toArray("[data-hcard]");
      wraps.forEach((w, i) => {
        if (i === wraps.length - 1) return;
        gsap.to(w.firstElementChild, {
          scale: 0.9, rotateX: -8, filter: "brightness(0.55)", transformOrigin: "50% 0%", ease: "none",
          scrollTrigger: { trigger: wraps[i + 1], start: "top 90%", end: "top 20%", scrub: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="bg-brand py-20 sm:py-24" style={{ perspective: "1400px" }}>
      <Container>
        <SectionHeader
          light
          eyebrow="Heritage"
          title="Top 10 heritage places in Bangladesh"
          subtitle="Scroll to stack through ancient ruins, mosques, forts and forests."
        />
        {PLACES.map((p, i) => (
          <div
            key={p.name}
            data-hcard
            className="sticky mb-12 h-[56vh] min-h-[23rem] sm:mb-16 sm:h-[64vh] lg:h-[70vh]"
            style={{ top: `${74 + i * 10}px` }}
          >
            <article className="relative h-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl will-change-transform">
              <Image src={img(i, 1600)} alt="" fill sizes="(min-width:1152px) 1100px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              <div className="absolute bottom-0 max-w-xl p-6 text-white sm:p-8 md:p-12">
                <p className="font-display text-4xl text-gold/90 sm:text-5xl md:text-6xl">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1.5 text-2xl font-semibold sm:text-3xl md:text-4xl">{p.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-sand sm:text-sm">{p.where}</p>
                <p className="mt-3 text-sm text-white/85 sm:mt-4 sm:text-base">{p.text}</p>
                {p.unesco && (
                  <span className="mt-3.5 inline-block rounded-full bg-gold px-3.5 py-1 text-[11px] font-semibold text-primary-dark sm:mt-4 sm:px-4 sm:text-xs">
                    UNESCO World Heritage Site
                  </span>
                )}
              </div>
            </article>
          </div>
        ))}
      </Container>
    </section>
  );
}