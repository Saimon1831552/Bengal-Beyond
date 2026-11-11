"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/gsap";

export default function SplitText({ text, as: Tag = "h2", className = "", delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (prefersReduced()) return;
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-w]"), {
        yPercent: 115, rotateX: -70, transformOrigin: "50% 100%",
        duration: 1, ease: "power4.out", stagger: 0.07, delay,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay]);

  return (
    <Tag ref={ref} className={className} style={{ perspective: 800 }}>
      <span className="sr-only">{text}</span>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true" className="mr-[0.25em] inline-block overflow-hidden pb-[0.12em] align-bottom">
          <span data-w className="inline-block will-change-transform">{w}</span>
        </span>
      ))}
    </Tag>
  );
}