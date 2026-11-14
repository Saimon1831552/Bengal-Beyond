"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function CustomCursor() {
  const dot = useRef(null), ring = useRef(null), label = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");

    const d = dot.current, r = ring.current, l = label.current;
    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.set(r, { width: 36, height: 36 });
    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3.out" });
    const dx = gsap.quickTo(d, "x", { duration: 0.08 });
    const dy = gsap.quickTo(d, "y", { duration: 0.08 });

    let mag = null, shown = false;

    const look = (t) => {
      const field = !!t.closest("input,textarea,select");
      const name = t.closest("[data-cursor]")?.dataset.cursor || "";
      const clickable = !!t.closest("a,button,[role=button]");
      mag = t.closest("[data-magnetic]");
      l.textContent = name;
      if (field) return gsap.to([d, r], { opacity: 0, duration: 0.15, overwrite: "auto" });
      gsap.to(d, { opacity: name ? 0 : 1, duration: 0.15, overwrite: "auto" });
      if (mag) {
        const b = mag.getBoundingClientRect();
        gsap.to(r, { width: b.width + 22, height: b.height + 22, opacity: 1, backgroundColor: "rgba(232,169,60,.14)", duration: 0.35, ease: "power3.out", overwrite: "auto" });
      } else if (name) {
        gsap.to(r, { width: 86, height: 86, opacity: 1, backgroundColor: "rgba(232,169,60,.92)", duration: 0.35, ease: "power3.out", overwrite: "auto" });
      } else {
        gsap.to(r, { width: clickable ? 56 : 36, height: clickable ? 56 : 36, opacity: 1, backgroundColor: "rgba(232,169,60,0)", duration: 0.3, overwrite: "auto" });
      }
    };

    const move = (e) => {
      if (!shown) { shown = true; gsap.set([d, r], { x: e.clientX, y: e.clientY }); }
      dx(e.clientX); dy(e.clientY);
      if (mag) {
        const b = mag.getBoundingClientRect();
        rx(b.left + b.width / 2 + (e.clientX - (b.left + b.width / 2)) * 0.25);
        ry(b.top + b.height / 2 + (e.clientY - (b.top + b.height / 2)) * 0.25);
      } else { rx(e.clientX); ry(e.clientY); }
    };
    const over = (e) => e.target instanceof Element && look(e.target);
    const down = () => gsap.fromTo(r, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,.4)" });
    const out = (e) => { if (!e.relatedTarget) gsap.to([d, r], { opacity: 0, duration: 0.2 }); };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerout", out);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerout", out);
    };
  }, []);

  return (
    <>
      <div ref={ring} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[80] grid place-items-center rounded-full border border-gold/80">
        <span ref={label} className="text-[11px] font-bold uppercase tracking-wider text-primary-dark" />
      </div>
      <div ref={dot} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[81] h-2 w-2 rounded-full bg-gold" />
    </>
  );
}