"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => <HeroFallback />,
});

function HeroFallback() {
  return (
    <div className="relative flex h-[360px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-gold/10 to-accent/10">
      <div className="h-44 w-44 rounded-full border border-primary/20 bg-primary/10 blur-xl" />
    </div>
  );
}

export default function Hero3DLoader() {
  const hostRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);

    const el = hostRef.current;
    if (!el) return () => mq.removeEventListener("change", onChange);

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "150px" }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <div ref={hostRef} className="h-[360px] w-full">
      {reducedMotion ? <HeroFallback /> : <Hero3D active={inView} />}
    </div>
  );
}