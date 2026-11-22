"use client";
import Container from "@/components/ui/Container";
import useFetch from "@/hooks/useFetch";

export default function TestimonialsSection() {
  const { data, loading } = useFetch("/public/testimonials");

  if (loading || !data?.length) return null;

  return (
    <section className="border-t border-border bg-background/60 py-16">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Traveler Stories</p>
          <h2 className="mt-2 font-display text-3xl text-primary">Journeys remembered across Bengal</h2>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <article key={t.id} className="flex flex-col justify-between rounded-2xl border border-border bg-white p-6">
              <div>
                <div className="text-sm font-bold text-gold" aria-label={`${t.rating} out of 5 stars`}>
                  {"★".repeat(t.rating)}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-primary">“{t.quote}”</p>
              </div>

              <div className="mt-5 border-t border-border pt-4 text-xs">
                <p className="font-semibold text-primary">{t.author_name}</p>
                <p className="text-muted">
                  {[t.author_location, t.tour_title].filter(Boolean).join(" · ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}