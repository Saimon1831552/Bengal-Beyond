"use client";
import Container from "@/components/ui/Container";
import Reveal from "@/components/fx/Reveal";
import NewsletterSignup from "@/components/public/NewsletterSignup";

export default function NewsletterBanner() {
  return (
    <section className="py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-primary-dark px-8 py-14 text-white shadow-2xl md:px-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-ocean/25 blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  Private Departure Alerts
                </p>
                <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                  Get seasonal Sundarbans, Sylhet &amp; Hill Tracts dates first
                </h2>
                <p className="mt-3 max-w-xl text-sm text-sand/90">
                  Small-group charters fill fast between October and March. Join our dispatch list for early seat access and member-only seasonal offers.
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                <NewsletterSignup />
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}