"use client";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import Reveal from "@/components/fx/Reveal";
import SectionHeader from "./SectionHeader";
import { formatPrice } from "@/lib/format";

export default function DayTours({ tours }) {
  return (
    <section className="py-24">
      <Container>
        <SectionHeader eyebrow="Day tours" title="Popular day tours" subtitle="Quick escapes, back by dinner." />
        <Reveal stagger={0.1} className="grid gap-6 pb-10 md:grid-cols-2">
          {tours.slice(0, 6).map((t, i) => (
            <div key={t.slug} className={i % 2 ? "md:translate-y-10" : ""}>
              <Link
                href={t.href}
                data-cursor="View"
                className="group lift flex items-center gap-5 rounded-2xl border border-border bg-white p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                  <Image src={t.image} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">{t.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{t.summary}</p>
                </div>
                {t.price != null && <span className="text-sm font-semibold text-terracotta">{formatPrice(t.price, t.currency)}</span>}
              </Link>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}