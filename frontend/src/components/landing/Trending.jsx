"use client";
import Link from "next/link";
import Image from "@/components/ui/RemoteImage";
import Container from "@/components/ui/Container";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "./SectionHeader";

const spans = [
  "col-span-2 row-span-2",
  "",
  "md:row-span-2",
  "",
  "md:col-span-2",
  "col-span-2",
];

export default function Trending({ destinations }) {
  if (!destinations.length) return null;

  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeader
          eyebrow="Trending"
          title="Trending destinations"
          subtitle="From tidal mangrove creeks to high tea valleys and coral islands."
        />
        <Reveal stagger={0.08} className="grid auto-rows-[205px] grid-cols-2 gap-4 md:grid-cols-4">
          {destinations.map((d, i) => (
            <Link
              key={d.slug}
              href={`/destinations/${d.slug}`}
              className={`group relative overflow-hidden rounded-3xl shadow-sm ${spans[i] || ""}`}
            >
              <Image
                src={d.image}
                alt={d.name}
                fill
                sizes="(min-width:768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-500 group-hover:from-black/85" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-5 text-white">
                <div>
                  {d.region && (
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
                      {d.region}
                    </p>
                  )}
                  <p className="font-display text-xl md:text-2xl">{d.name}</p>
                  {d.tourCount > 0 && (
                    <p className="mt-0.5 text-xs text-white/75">
                      {d.tourCount} {d.tourCount === 1 ? "tour" : "tours"}
                    </p>
                  )}
                </div>
                <span className="translate-y-2 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-primary-dark opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}