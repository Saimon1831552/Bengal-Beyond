"use client";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import ClipReveal from "@/components/fx/ClipReveal";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "./SectionHeader";

export default function Blogs({ posts }) {
  return (
    <section className="py-24">
      <Container>
        <SectionHeader eyebrow="Journal" title="Stories from the road" />
        <Reveal stagger={0.12} className="grid gap-8 md:grid-cols-3">
          {posts.map((p, i) => (
            <Link key={p.title} href={p.href} className="group block">
              <ClipReveal className="relative aspect-[4/3]" delay={i * 0.12}>
                <Image src={p.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </ClipReveal>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-terracotta">{p.read} min read</p>
              <h3 className="mt-2 text-xl font-semibold text-primary">{p.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Read More
                <span className="inline-block h-px w-6 bg-current transition-all duration-300 group-hover:w-12" />
                <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
              </span>
            </Link>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}