"use client";
import Container from "@/components/ui/Container";
import Counter from "@/components/fx/Counter";
import ShaderCanvas from "@/components/fx/ShaderCanvas";
import { AURORA } from "@/lib/shaders";
import SectionHeader from "./SectionHeader";

export default function Stats({ stats }) {
  if (!stats?.length) return null;

  const cols =
    stats.length <= 2
      ? "sm:grid-cols-2 max-w-2xl mx-auto"
      : stats.length === 3
        ? "sm:grid-cols-3 max-w-4xl mx-auto"
        : "grid-cols-2 lg:grid-cols-4";

  return (
    <section className="relative overflow-hidden py-24 text-white">
      <ShaderCanvas frag={AURORA} dprMax={1} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-primary-dark/45" />
      <Container className="relative">
        <SectionHeader light eyebrow="Trust" title="Why travellers keep faith in Bengal Beyond" />
        <div className={`grid gap-6 text-center ${cols}`}>
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-white/15 bg-white/10 px-6 py-8 backdrop-blur-md"
            >
              <p className="font-display text-5xl font-semibold text-gold md:text-6xl">
                <Counter to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-sand">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}