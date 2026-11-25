"use client";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import TiltCard from "@/components/fx/TiltCard";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "./SectionHeader";
import { WHY } from "./data";

export default function WhyChoose() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeader
          eyebrow="Why Bengal Beyond"
          title="Why travellers choose us"
          subtitle="Everything you need for a trip you will actually remember."
        />
        <Reveal stagger={0.12} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => (
            <TiltCard
              key={w.title}
              className="lift relative h-full rounded-3xl border border-border bg-background p-7 shadow-sm transition-colors hover:border-gold/60"
            >
              <span className="absolute right-6 top-6 font-display text-sm font-semibold text-muted/60">
                0{i + 1}
              </span>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.4 + i * 0.45, repeat: Infinity, ease: "easeInOut" }}
                style={{ transform: "translateZ(60px)" }}
                className="grid h-14 w-14 place-items-center rounded-2xl bg-sea text-white shadow-lg"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={w.icon} />
                </svg>
              </motion.div>
              <h3 className="mt-6 text-xl font-semibold text-primary" style={{ transform: "translateZ(30px)" }}>
                {w.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted" style={{ transform: "translateZ(20px)" }}>
                {w.text}
              </p>
            </TiltCard>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}