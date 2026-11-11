"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/gsap";

export default function Counter({ to, suffix = "", duration = 2.2 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (prefersReduced()) { el.textContent = to.toLocaleString() + suffix; return; }
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: to, duration, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString() + suffix; },
      });
    }, el);
    return () => ctx.revert();
  }, [to, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}