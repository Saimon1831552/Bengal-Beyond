"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { FEATURE_ROWS, img } from "./data";

function Row({ row, reverse, offset }) {
  const [active, setActive] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      refs.current.forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setActive(i) });
        gsap.from(el, { x: reverse ? -50 : 50, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      });
    });
    return () => ctx.revert();
  }, [reverse]);

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <div className={`md:sticky md:top-28 md:h-[30rem] md:self-start ${reverse ? "md:order-2" : ""}`}>
        <div className="relative h-80 overflow-hidden rounded-3xl shadow-xl md:h-full">
          {row.items.map((it, i) => (
            <Image key={it.title} src={img(offset + i, 1200)} alt={it.title} fill sizes="(min-width:768px) 45vw, 100vw"
              className={`object-cover transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <p className="absolute bottom-5 left-5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
            {String(active + 1).padStart(2, "0")} / {String(row.items.length).padStart(2, "0")} · {row.items[active].title}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">{row.eyebrow}</p>
        <h3 className="mt-3 text-3xl font-semibold text-primary md:text-4xl">{row.title}</h3>
        {row.items.map((it, i) => (
          <div key={it.title} ref={(el) => (refs.current[i] = el)} className="flex min-h-[55vh] items-center">
            <div className={`transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-30"}`}>
              <p className="font-display text-6xl text-gold">{String(i + 1).padStart(2, "0")}</p>
              <h4 className="mt-2 text-2xl font-semibold text-primary">{it.title}</h4>
              <p className="mt-2 max-w-md text-muted">{it.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeatureShowcase() {
  return (
    <section className="py-24">
      <Container className="space-y-24">
        {FEATURE_ROWS.map((row, i) => <Row key={row.title} row={row} reverse={i % 2 === 1} offset={i * 2} />)}
      </Container>
    </section>
  );
}