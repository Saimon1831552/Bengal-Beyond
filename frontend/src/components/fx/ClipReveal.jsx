"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/gsap";

export default function ClipReveal({ className = "", radius = "2rem", delay = 0, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (prefersReduced()) return;
    const el = ref.current;
    const ctx = gsap.context(() => {
      const st = { trigger: el, start: "top 85%", once: true };
      gsap.fromTo(el, { clipPath: `inset(0 0 100% 0 round ${radius})` }, { clipPath: `inset(0 0 0% 0 round ${radius})`, duration: 1.3, ease: "power4.inOut", delay, scrollTrigger: st });
      gsap.from(el.firstElementChild, { scale: 1.35, duration: 1.8, ease: "power3.out", delay, scrollTrigger: st });
    }, el);
    return () => ctx.revert();
  }, [radius, delay]);

  return <div ref={ref} className={`overflow-hidden ${className}`} style={{ borderRadius: radius }}>{children}</div>;
}
