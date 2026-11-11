"use client";
import SplitText from "@/components/fx/SplitText";
import Reveal from "@/components/fx/Reveal";

export default function SectionHeader({ eyebrow, title, subtitle, light = false, center = true }) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <Reveal y={16}>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">{eyebrow}</p>
      </Reveal>
      <SplitText text={title} className={`mt-3 text-4xl font-semibold md:text-5xl ${light ? "text-white" : "text-primary"}`} />
      {subtitle && (
        <Reveal y={20} delay={0.2}>
          <p className={`mt-4 ${light ? "text-sand" : "text-muted"}`}>{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}