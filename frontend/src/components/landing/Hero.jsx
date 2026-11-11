"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { img } from "./data";

export default function Hero({ destinations = [] }) {
  const featuredDestinations = destinations.slice(0, 3);

  return (
    <section className="relative isolate flex min-h-[min(760px,100svh)] items-center overflow-hidden bg-primary-dark pt-16 text-white">
      <Image
        src={img(0, 2200)}
        alt="A view of the Bay of Bengal coastline"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-dark/90 via-primary-dark/60 to-primary-dark/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-dark/50 via-transparent to-primary-dark/20" />

      <Container className="relative py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-gold sm:text-base">
            Discover Bangladesh with local experts
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            Go beyond the
            <span className="block text-gold">usual journey.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            From quiet tea gardens to the world’s largest mangrove forest,
            discover Bangladesh at your own pace with people who call it home.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/tours"
              className="rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-primary-dark transition-colors hover:bg-white"
            >
              Explore our tours
            </Link>
            <Link
              href="/destinations"
              className="rounded-full border border-white/60 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Browse destinations
            </Link>
          </div>

          {featuredDestinations.length > 0 && (
            <div className="mt-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Start exploring
              </p>
              <div className="flex flex-wrap gap-2">
                {featuredDestinations.map((destination) => (
                  <Link
                    key={destination.slug}
                    href={`/destinations/${destination.slug}`}
                    className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    {destination.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>

      <div className="pointer-events-none absolute bottom-8 right-8 hidden items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/70 md:flex">
        <span className="h-px w-12 bg-gold" />
        Travel that goes beyond
      </div>
    </section>
  );
}