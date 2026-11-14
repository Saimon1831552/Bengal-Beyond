"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Reveal from "@/components/fx/Reveal";
import { GALLERY } from "./data";

export default function Gallery() {
  const [open, setOpen] = useState(null);
  const N = GALLERY.length;

  useEffect(() => {
    if (open === null) return;
    const key = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o + 1) % N);
      if (e.key === "ArrowLeft") setOpen((o) => (o - 1 + N) % N);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  }, [open, N]);

  return (
    <section className="py-24">
      <Container className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
        <div className="md:sticky md:top-28 md:self-start">
          <Reveal x={-40} y={0}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">Gallery</p>
            <h2 className="mt-3 text-4xl font-semibold text-primary md:text-5xl">Moments from the road</h2>
            <p className="mt-5 max-w-md text-muted">
              Sunrise over the Bay of Bengal, mist on the tea hills, a boat easing into a mangrove creek. Scroll the frames and tap any photo to see it full screen.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {GALLERY.map((g, i) => (
            <motion.button
              key={i}
              layoutId={`g-${i}`}
              onClick={() => setOpen(i)}
              data-cursor="Open"
              style={{ aspectRatio: g.ratio }}
              className={`relative overflow-hidden rounded-2xl ${i % 3 === 0 ? "col-span-2" : ""}`}
              aria-label={`Open photo: ${g.caption}`}
            >
              <Image src={g.src} alt={g.caption} fill sizes="(min-width:768px) 30vw, 50vw" className="object-cover transition-transform duration-500 hover:scale-105" />
            </motion.button>
          ))}
        </div>
      </Container>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog" aria-modal="true" aria-label="Photo viewer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-4"
          >
            <motion.div layoutId={`g-${open}`} onClick={(e) => e.stopPropagation()} className="relative h-[80vh] w-[92vw] max-w-5xl overflow-hidden rounded-2xl">
              <Image src={GALLERY[open].src} alt={GALLERY[open].caption} fill sizes="92vw" className="object-contain" priority />
              <p className="absolute bottom-4 left-4 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white backdrop-blur">{GALLERY[open].caption}</p>
            </motion.div>
            <button onClick={() => setOpen(null)} aria-label="Close" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl text-white backdrop-blur hover:bg-white/30">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}