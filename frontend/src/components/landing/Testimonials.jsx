"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeader from "./SectionHeader";
import { REVIEWS } from "./data";

export default function Testimonials() {
  const n = REVIEWS.length;
  const [active, setActive] = useState(0);
  const [spread, setSpread] = useState(300);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const on = () => setSpread(window.innerWidth < 640 ? 130 : window.innerWidth < 1024 ? 220 : 310);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 4500);
    return () => clearInterval(id);
  }, [paused, n]);

  const offset = (i) => { let d = i - active; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d; };

  return (
    <section className="overflow-hidden bg-white py-24">
      <Container>
        <SectionHeader eyebrow="Testimonials" title="What travellers say about us" />
      </Container>
      <div
        className="relative mx-auto h-[22rem] max-w-6xl"
        style={{ perspective: 1400 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {REVIEWS.map((r, i) => {
          const o = offset(i);
          const a = Math.abs(o);
          return (
            <motion.article
              key={r.name}
              onClick={() => setActive(i)}
              animate={{ x: o * spread, z: -a * 120, rotateY: -o * 28, scale: o === 0 ? 1 : 0.84, opacity: a > 2 ? 0 : o === 0 ? 1 : 0.6, filter: `blur(${a ? 3 : 0}px)` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{ zIndex: 10 - a, pointerEvents: a > 2 ? "none" : "auto" }}
              className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-3xl border border-border bg-background p-7 shadow-xl sm:w-80"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary font-semibold text-white">{r.name[0]}</div>
                <div>
                  <p className="font-semibold text-primary">{r.name}</p>
                  <p className="text-xs text-muted">{r.place}</p>
                </div>
              </div>
              <div className="mt-4 text-gold" aria-label={`${r.stars} out of 5 stars`}>{"★".repeat(r.stars)}<span className="text-border">{"★".repeat(5 - r.stars)}</span></div>
              <p className="mt-3 text-sm text-foreground/80">“{r.text}”</p>
            </motion.article>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {REVIEWS.map((r, i) => (
          <button key={r.name} aria-label={`Show review ${i + 1}`} onClick={() => setActive(i)} className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-primary" : "w-2 bg-border"}`} />
        ))}
      </div>
    </section>
  );
}