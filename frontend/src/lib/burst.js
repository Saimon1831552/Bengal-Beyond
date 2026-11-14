import { gsap } from "gsap";

const COLORS = ["#E8A93C", "#D2693F", "#1B9C7B", "#1C7CB5", "#F0E3C8"];

export function burst(x, y, n = 18) {
  if (typeof document === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    const size = 6 + Math.random() * 6;
    Object.assign(s.style, {
      position: "fixed", left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px`,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px", background: COLORS[i % COLORS.length],
      pointerEvents: "none", zIndex: 9999,
    });
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 90;
    gsap.to(s, {
      x: Math.cos(a) * dist, y: Math.sin(a) * dist + 40, rotation: Math.random() * 540 - 270,
      opacity: 0, scale: 0.3, duration: 0.9 + Math.random() * 0.4, ease: "power3.out",
      onComplete: () => s.remove(),
    });
  }
}