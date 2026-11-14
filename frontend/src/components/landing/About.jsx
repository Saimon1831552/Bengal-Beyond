"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import ClipReveal from "@/components/fx/ClipReveal";
import SectionHeader from "./SectionHeader";
import { gsap, prefersReduced } from "@/lib/gsap";
import { img } from "./data";

export default function About() {
  const root = useRef(null);
  useEffect(() => {
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-slide]", {
        x: -70, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.15,
        scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
      });
      gsap.utils.toArray("[data-pan]").forEach((box) => {
        const s = parseFloat(box.dataset.pan);
        gsap.fromTo(box.firstElementChild, { yPercent: -s }, {
          yPercent: s, ease: "none",
          scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="pt-48 pb-24">
      <Container className="grid items-center gap-16 md:grid-cols-2">
        <div>
          <div data-slide><SectionHeader center={false} eyebrow="About us" title="Travel that goes beyond the ordinary" /></div>
          <p data-slide className="text-muted">
            Bengal Beyond is a Bangladesh-based tour operator. We design journeys through mangrove forests, tea hills, ancient ruins and living cities, led by guides who call these places home.
          </p>
          <p data-slide className="mt-4 text-muted">
            Small groups, honest pricing and slow, curious travel: that is how we work.
          </p>
          <ul data-slide className="mt-6 space-y-2 text-sm font-medium text-primary">
            <li>✓ Locally led, responsibly run</li>
            <li>✓ Small groups, flexible plans</li>
            <li>✓ Clear pricing before you pay</li>
          </ul>
        </div>

        <div className="relative h-[34rem]">
          <div className="absolute -left-6 top-10 -z-10 h-56 w-56 rounded-full bg-terracotta/25 blur-2xl" />
          <div className="absolute -right-4 bottom-0 -z-10 h-64 w-64 rounded-[40%] bg-ocean/20 blur-2xl" />
          <ClipReveal className="absolute right-0 top-0 h-[22rem] w-4/5 shadow-xl" delay={0.12}>
            <div data-pan="8" className="absolute inset-0 overflow-hidden rounded-[2rem]">
              <div className="absolute inset-x-0 -inset-y-[12%]">
                <Image src={img(2, 1200)} alt="Tea estates in the hills" fill sizes="(min-width:768px) 35vw, 80vw" className="object-cover" />
              </div>
            </div>
          </ClipReveal>
          <ClipReveal className="absolute bottom-0 left-0 h-72 w-3/5 border-8 border-white shadow-2xl" delay={0.24}>
            <div data-pan="12" className="absolute inset-0 overflow-hidden rounded-[1.5rem]">
              <div className="absolute inset-x-0 -inset-y-[15%]">
                <Image src={img(0, 1000)} alt="Bay of Bengal coast" fill sizes="(min-width:768px) 25vw, 60vw" className="object-cover" />
              </div>
            </div>
          </ClipReveal>
        </div>
      </Container>
    </section>
  );
}