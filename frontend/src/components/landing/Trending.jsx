"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import Container from "@/components/ui/Container";
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
  const [label, setLabel] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 450, damping: 32 });
  const sy = useSpring(y, { stiffness: 450, damping: 32 });

  return (
    <section className="bg-white py-24" onMouseMove={(e) => { x.set(e.clientX + 18); y.set(e.clientY + 18); }}>
      <Container>
        <SectionHeader eyebrow="Trending" title="Trending destinations" />
        <div className="grid auto-rows-[190px] grid-cols-2 gap-4 md:grid-cols-4">
          {destinations.map((d, i) => (
            <Link
              key={d.slug}
              href={`/destinations/${d.slug}`}
              onMouseEnter={() => setLabel(d.name)}
              onMouseLeave={() => setLabel(null)}
              className={`group relative overflow-hidden rounded-3xl ${spans[i] || ""}`}
            >
              <Image src={d.image} alt={d.name} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-125" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-4 left-5 font-display text-xl text-white md:text-2xl">{d.name}</p>
            </Link>
          ))}
        </div>
      </Container>

      <motion.div style={{ x: sx, y: sy }} className="pointer-events-none fixed left-0 top-0 z-50">
        <AnimatePresence>
          {label && (
            <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} className="block rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-primary-dark shadow-lg">
              {label} →
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}