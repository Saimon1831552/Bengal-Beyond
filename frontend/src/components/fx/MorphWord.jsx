"use client";
import { useEffect, useRef } from "react";
import { prefersReduced } from "@/lib/gsap";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export default function MorphWord({ words, className = "", interval = 2800 }) {
  const ref = useRef(null);
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  useEffect(() => {
    const el = ref.current;
    el.textContent = words[0];
    if (prefersReduced()) return;
    let i = 0, raf = 0;

    const scramble = (to) => {
      const from = el.textContent;
      const len = Math.max(from.length, to.length);
      const start = performance.now(), dur = 900;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        let out = "";
        for (let k = 0; k < len; k++) {
          const lock = p * len * 1.2 - k;
          if (lock >= 1) out += to[k] ?? "";
          else if (lock > 0) out += to[k] === " " ? " " : CHARS[(Math.random() * CHARS.length) | 0];
          else out += from[k] ?? "";
        }
        el.textContent = out;
        if (p < 1) raf = requestAnimationFrame(step); else el.textContent = to;
      };
      raf = requestAnimationFrame(step);
    };

    const timer = setInterval(() => { i = (i + 1) % words.length; scramble(words[i]); }, interval);
    return () => { clearInterval(timer); cancelAnimationFrame(raf); };
  }, [words, interval]);

  return (
    <span className="relative inline-block">
      <span aria-hidden="true" className="invisible block whitespace-nowrap">{longest}</span>
      <span ref={ref} aria-hidden="true" className={`absolute inset-0 whitespace-nowrap ${className}`} />
    </span>
  );
}