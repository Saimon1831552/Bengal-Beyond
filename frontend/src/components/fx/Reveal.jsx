"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/gsap";

export default function Reveal({ as: Tag = "div", y = 40, x = 0, delay = 0, stagger = 0, className = "", children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (prefersReduced()) return;
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap.from(stagger ? el.children : el, {
        y, x, opacity: 0, duration: 0.9, ease: "power3.out", delay, stagger,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [y, x, delay, stagger]);
  return <Tag ref={ref} className={className}>{children}</Tag>;
}