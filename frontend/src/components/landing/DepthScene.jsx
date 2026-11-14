"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/gsap";

const CAPTIONS = [
  ["Dawn", "Light breaks over the Bay of Bengal."],
  ["Drift", "Slide through mangrove creeks where tigers walk."],
  ["Beyond", "Hills, tea and ancient ruins. All of it, beyond the ordinary."],
];

const hill = (cls, d, fill, attr) => (
  <svg {...{ [attr]: "" }} viewBox="0 0 1440 600" preserveAspectRatio="none"
    className={`absolute bottom-0 w-full ${cls}`} style={{ transformOrigin: "50% 100%" }} aria-hidden="true">
    <path d={d} fill={fill} />
  </svg>
);

export default function DepthScene() {
  const root = useRef(null);

  useEffect(() => {
    if (prefersReduced()) {
      gsap.set("[data-cap]:not(:first-child)", { display: "none" });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.set("[data-cap]:not(:first-child)", { opacity: 0 });
      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=260%", scrub: 1, pin: true, anticipatePin: 1 },
      });
      tl.to("[data-sun]", { yPercent: -130, scale: 1.3 }, 0)
        .to("[data-sky-day]", { opacity: 1 }, 0)
        .to("[data-far]", { scale: 1.06, yPercent: 4 }, 0)
        .to("[data-mid]", { scale: 1.18, yPercent: 8 }, 0)
        .to("[data-near]", { scale: 1.45, yPercent: 14 }, 0)
        .to("[data-mist]", { xPercent: -14 }, 0)
        .to("[data-cap]:nth-child(1)", { opacity: 0, y: -40, duration: 0.1 }, 0.28)
        .fromTo("[data-cap]:nth-child(2)", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.1 }, 0.36)
        .to("[data-cap]:nth-child(2)", { opacity: 0, y: -40, duration: 0.1 }, 0.62)
        .fromTo("[data-cap]:nth-child(3)", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.1 }, 0.7);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-screen overflow-hidden bg-primary-dark" aria-label="Journey from dawn to beyond">
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #E8A93C 0%, #D2693F 35%, #3a3f78 75%, #1d2b4f 100%)" }} />
      <div data-sky-day className="absolute inset-0 opacity-0" style={{ background: "linear-gradient(to top, #F7E9C6 0%, #8fd0e6 45%, #1C7CB5 100%)" }} />
      <div data-sun className="absolute bottom-[26%] left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#FFF3C4] to-gold shadow-[0_0_120px_40px_rgba(232,169,60,.65)]" />
      <div data-mist className="absolute bottom-[30%] left-[10%] h-40 w-[60%] rounded-full bg-white/25 blur-3xl" />
      <div data-mist className="absolute bottom-[22%] right-[5%] h-32 w-[50%] rounded-full bg-white/20 blur-3xl" />

      {hill("h-[62%]", "M0 380 C200 300 360 340 520 310 C700 275 860 350 1040 320 C1200 295 1320 330 1440 300 L1440 600 L0 600Z", "#2b7f8c", "data-far")}
      {hill("h-[52%]", "M0 440 C180 380 320 430 520 400 C720 370 900 440 1100 410 C1250 390 1360 420 1440 400 L1440 600 L0 600Z", "#0E4D3A", "data-mid")}
      {hill("h-[40%]", "M0 500 C240 450 420 520 680 480 C900 445 1120 520 1440 470 L1440 600 L0 600Z", "#082B21", "data-near")}

      <div className="absolute inset-0 grid place-items-center px-6 text-center">
        <div className="grid">
          {CAPTIONS.map(([k, t]) => (
            <div key={k} data-cap style={{ gridArea: "1 / 1" }} className="glass-deep mx-auto max-w-xl rounded-3xl px-8 py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{k}</p>
              <p className="mt-3 font-display text-3xl font-semibold text-white md:text-5xl">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}