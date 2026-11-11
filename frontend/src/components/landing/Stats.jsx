"use client";
import Image from "next/image";
import Container from "@/components/ui/Container";
import Counter from "@/components/fx/Counter";
import SectionHeader from "./SectionHeader";
import { STATS, img } from "./data";

export default function Stats() {
  return (
    <section className="relative overflow-hidden py-24 text-white">
      <Image src={img(1, 1800)} alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-primary-dark/85" />
      <Container className="relative">
        <SectionHeader light eyebrow="Trust" title="Why travellers keep faith in Bengal Beyond" />
        <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display text-5xl font-semibold text-gold md:text-6xl"><Counter to={s.to} suffix={s.suffix} /></p>
              <p className="mt-2 text-sm uppercase tracking-widest text-sand">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}