"use client";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "./SectionHeader";

const DEFAULT_HIGHLIGHTS = ["Guided by a local expert", "Handpicked stays and meals", "Transport between stops", "Flexible pace for small groups"];

export default function ShortTours({ tours }) {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeader eyebrow="Short tours" title="Popular short tours" subtitle="Two to three days, packed with the best of a region." />
        <Reveal stagger={0.12} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tours.slice(0, 6).map((t) => (
            <div key={t.slug} className="group h-[26rem] [perspective:1200px]">
              <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]">
                <div className="absolute inset-0 overflow-hidden rounded-3xl [backface-visibility:hidden]">
                  <Image src={t.image} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gold">{t.days} days</p>
                    <h3 className="mt-1 text-2xl font-semibold">{t.title}</h3>
                    <p className="mt-2 text-xs text-white/70">Hover to see highlights</p>
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col rounded-3xl bg-primary p-7 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gold">Itinerary highlights</p>
                  <ul className="mt-4 flex-1 space-y-3 text-sm">
                    {(t.highlights || DEFAULT_HIGHLIGHTS).map((h) => (
                      <li key={h} className="flex gap-2"><span className="text-gold">✦</span>{h}</li>
                    ))}
                  </ul>
                  <Link href={t.href} className="rounded-full bg-gold px-5 py-2.5 text-center text-sm font-semibold text-primary-dark">View itinerary</Link>
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}