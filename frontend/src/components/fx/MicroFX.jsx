"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { burst } from "@/lib/burst";

function ripple(el, e) {
  const b = el.getBoundingClientRect();
  const s = document.createElement("span");
  s.className = "fx-ripple";
  s.style.left = `${e.clientX - b.left}px`;
  s.style.top = `${e.clientY - b.top}px`;
  el.appendChild(s);
  s.addEventListener("animationend", () => s.remove());
}

export default function MicroFX() {
  const bar = useRef(null);

  useEffect(() => {
    gsap.set(bar.current, { scaleX: 0 });
    const tween = gsap.to(bar.current, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    const down = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-burst]")) burst(e.clientX, e.clientY);
      const r = t.closest(".btn-gold,[data-ripple]");
      if (r) ripple(r, e);
    };
    document.addEventListener("pointerdown", down);
    return () => { document.removeEventListener("pointerdown", down); tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <div ref={bar} aria-hidden="true" style={{ transformOrigin: "0 50%" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] bg-gradient-to-r from-accent via-gold to-terracotta" />
  );
}