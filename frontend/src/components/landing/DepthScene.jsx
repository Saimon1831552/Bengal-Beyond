"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReduced } from "@/lib/gsap";

const CAPTIONS = [
  {
    step: "01 · Dawn",
    title: "Light breaks over the Bay of Bengal.",
    sub: "First golden rays across Kuakata & Cox's Bazar tides",
  },
  {
    step: "02 · Drift",
    title: "Slide through mangrove creeks where tigers walk.",
    sub: "Silent wooden boats deep inside the Sundarbans",
  },
  {
    step: "03 · Beyond",
    title: "Hills, tea and ancient ruins. Beyond the ordinary.",
    sub: "From Sajek cloud ridges to Srimangal tea valleys",
  },
];

// Layered real landscape photography for realistic 2.5D depth
const LAYER_FAR =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80"; // misty mountain horizon
const LAYER_MID =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80"; // river & forested valley
const LAYER_NEAR =
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80"; // deep mangrove canopy

export default function DepthScene() {
  const root = useRef(null);

  useEffect(() => {
    if (prefersReduced()) {
      gsap.set("[data-cap]:not(:first-child)", { display: "none" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set("[data-cap]:not(:first-child)", { opacity: 0, y: 36, scale: 0.96 });

      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=250%",
          scrub: 1.1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Sky & golden sun rise
      tl.to("[data-sun]", { yPercent: -145, scale: 1.35 }, 0)
        .to("[data-sunbeams]", { opacity: 0.75, scale: 1.2, rotation: 8 }, 0)
        .to("[data-sky-day]", { opacity: 0.92 }, 0)
        .to("[data-water-glint]", { opacity: 0.85, scaleX: 1.35 }, 0)

        // Realistic 2.5D photographic depth planes
        .to("[data-plane-far]", { scale: 1.12, yPercent: 3 }, 0)
        .to("[data-plane-mid]", { scale: 1.26, yPercent: 7, opacity: 0.95 }, 0)
        .to("[data-plane-near]", { scale: 1.48, yPercent: 14, opacity: 0.45 }, 0)

        // Drifting atmospheric river mist & distant birds
        .to("[data-mist-left]", { xPercent: -18, opacity: 0.55 }, 0)
        .to("[data-mist-right]", { xPercent: 16, opacity: 0.5 }, 0)
        .to("[data-birds]", { xPercent: 42, yPercent: -24, scale: 0.85 }, 0)

        // Progress bar fill
        .to("[data-progress]", { scaleX: 1 }, 0)

        // Act 1 -> Act 2 -> Act 3 glassmorphic story cards
        .to("[data-cap]:nth-child(1)", { opacity: 0, y: -36, scale: 0.96, duration: 0.12 }, 0.26)
        .fromTo(
          "[data-cap]:nth-child(2)",
          { opacity: 0, y: 36, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.12 },
          0.35
        )
        .to("[data-cap]:nth-child(2)", { opacity: 0, y: -36, scale: 0.96, duration: 0.12 }, 0.62)
        .fromTo(
          "[data-cap]:nth-child(3)",
          { opacity: 0, y: 36, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.12 },
          0.71
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative h-[100dvh] overflow-hidden bg-[#082B21]"
      aria-label="Journey from dawn to beyond"
    >
      {/* Pre-dawn atmospheric sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, #E8A93C 0%, #D2693F 28%, #35416E 68%, #131F3D 100%)",
        }}
      />

      {/* Morning daylight sky cross-fade */}
      <div
        data-sky-day
        className="absolute inset-0 opacity-0"
        style={{
          background:
            "linear-gradient(to top, #F6E6C2 0%, #89C8DE 44%, #1A6FA3 100%)",
        }}
      />

      {/* Far misty mountain & cloud horizon */}
      <div
        data-plane-far
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-55 mix-blend-luminosity blur-[1px]"
        style={{
          backgroundImage: `url(${LAYER_FAR})`,
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.15) 85%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.15) 85%)",
        }}
      />

      {/* Volumetric sunbeams & rising sun */}
      <div
        data-sunbeams
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[18%] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-35 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,244,196,0.75) 0%, rgba(232,169,60,0.28) 45%, transparent 72%)",
        }}
      />
      <div
        data-sun
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[24%] left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#FFF8DC] via-[#F6C86E] to-[#E8A93C] shadow-[0_0_110px_35px_rgba(232,169,60,0.7)] sm:h-40 sm:w-40"
      />

      {/* Distant migrating river birds silhouette */}
      <svg
        data-birds
        aria-hidden="true"
        viewBox="0 0 220 80"
        className="pointer-events-none absolute left-[24%] top-[28%] w-36 text-[#14201C]/55 sm:w-48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M10 42 Q22 30 34 42 Q46 30 58 42" />
        <path d="M76 24 Q85 15 94 24 Q103 15 112 24" />
        <path d="M135 50 Q143 42 151 50 Q159 42 167 50" />
        <path d="M178 30 Q184 24 190 30 Q196 24 202 30" />
      </svg>

      {/* Mid-ground river & forested valley plane */}
      <div
        data-plane-mid
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] bg-cover bg-bottom opacity-80"
        style={{
          backgroundImage: `url(${LAYER_MID})`,
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 45%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 45%, transparent 100%)",
        }}
      />

      {/* Shimmering sun reflection on river water */}
      <div
        data-water-glint
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12%] left-1/2 h-14 w-64 -translate-x-1/2 rounded-full opacity-40 blur-xl sm:w-96"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,243,196,0.85) 0%, rgba(232,169,60,0.35) 50%, transparent 80%)",
        }}
      />

      {/* Drifting river mist banks */}
      <div
        data-mist-left
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[26%] left-[4%] h-36 w-[65%] rounded-full bg-white/25 blur-3xl"
      />
      <div
        data-mist-right
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[18%] right-[2%] h-32 w-[55%] rounded-full bg-[#F0E3C8]/25 blur-3xl"
      />

      {/* Foreground mangrove canopy framing plane */}
      <div
        data-plane-near
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-cover bg-bottom opacity-85 mix-blend-multiply"
        style={{
          backgroundImage: `url(${LAYER_NEAR})`,
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 35%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 35%, transparent 100%)",
        }}
      />

      {/* Grounding bottom vignette for crisp text contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#082B21]/90 via-[#082B21]/20 to-black/35"
      />

      {/* Story Captions */}
      <div className="relative z-10 flex h-full items-center justify-center px-4 text-center sm:px-6">
        <div className="grid w-full max-w-2xl">
          {CAPTIONS.map((item) => (
            <div
              key={item.step}
              data-cap
              style={{ gridArea: "1 / 1" }}
              className="glass-deep mx-auto w-full rounded-3xl px-6 py-7 sm:px-10 sm:py-9"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                {item.step}
              </p>
              <p className="mt-3 font-display text-2xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
                {item.title}
              </p>
              <p className="mt-3 text-xs text-sand/90 sm:text-sm">
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle bottom scroll progress bar */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/75">
          Scroll to explore
        </span>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/20">
          <div
            data-progress
            className="h-full w-full origin-left scale-x-0 rounded-full bg-gold"
          />
        </div>
      </div>
    </section>
  );
}