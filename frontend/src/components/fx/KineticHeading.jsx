"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/gsap";

export default function KineticHeading({ text, className = "", base = 500, peak = 850, radius = 150 }) {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const wraps = [...el.querySelectorAll("[data-e]")];
    const letters = [...el.querySelectorAll("[data-l]")];
    const reduced = prefersReduced();
    if (!reduced) gsap.from(wraps, { yPercent: 110, rotateX: -80, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.05, delay: 0.2 });
    if (reduced || !window.matchMedia("(hover: hover)").matches) return;

    let px = -9999, py = -9999, raf = 0;
    const apply = () => {
      raf = 0;
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const f = Math.max(0, 1 - d / radius);
        const e = f * f * (3 - 2 * f);
        l.style.fontWeight = Math.round(base + (peak - base) * e);
        l.style.transform = `translateY(${-e * 10}px) skewX(${-e * 8}deg)`;
      }
    };
    const move = (e) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, [base, peak, radius]);

  return (
    <span ref={root} className={className} style={{ perspective: 800 }}>
      {[...text].map((ch, i) => (
        <span key={i} data-e className="inline-block">
          <span data-l className="inline-block will-change-transform" style={{ fontWeight: base }}>{ch === " " ? "\u00A0" : ch}</span>
        </span>
      ))}
    </span>
  );
}