"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";

export default function FaqsPage() {
  const { data, error, loading, reload } = useFetch("/public/faqs");
  const [openId, setOpenId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...new Set((data || []).map((f) => f.category))];
  const filtered = (data || []).filter((f) => activeCategory === "All" || f.category === activeCategory);

  return (
    <Container as="main" className="py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Help Center</p>
        <h1 className="mt-2 font-display text-4xl text-primary">Frequently asked questions</h1>
        <p className="mt-2 text-sm text-muted">Everything you need to know about bookings, permits, payments, and private tours.</p>
      </div>

      {loading ? (
        <div className="mt-8"><Loading /></div>
      ) : error ? (
        <div className="mt-8"><ErrorBox error={error} onRetry={reload} /></div>
      ) : !data?.length ? (
        <div className="mt-8"><Empty>FAQs are being updated. Check back soon!</Empty></div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-primary hover:bg-primary/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-white">
            {filtered.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="p-5">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{faq.category}</span>
                      <h2 className="mt-0.5 text-base font-semibold text-primary">{faq.question}</h2>
                    </div>
                    <span className="text-lg font-bold text-primary">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{faq.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Container>
  );
}