"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Magnetic from "@/components/fx/Magnetic";
import { burst } from "@/lib/burst";
import { siteConfig } from "@/config/site";

const columns = [
  { title: "Explore", links: [["/destinations", "Destinations"], ["/tours", "Tours"], ["/blog", "Travel blog"]] },
  { title: "Company", links: [["/about", "About us"], ["/contact", "Contact"]] },
];

const socials = [
  { key: "facebook", label: "Facebook", icon: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8z" /> },
  { key: "instagram", label: "Instagram", icon: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r=".6" /></> },
  { key: "youtube", label: "YouTube", icon: <><rect x="3" y="6" width="18" height="12" rx="4" /><path d="M10 9.5v5l4.5-2.5z" /></> },
  { key: "x", label: "X", icon: <path d="M5 5l14 14M19 5L5 19" /> },
];

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done

  const submit = async (e) => {
    const b = e.currentTarget.querySelector("button").getBoundingClientRect();
    e.preventDefault();
    setState("loading");
    // TODO: POST to a real newsletter endpoint. This only simulates success.
    await new Promise((r) => setTimeout(r, 900));
    setState("done");
    burst(b.left + b.width / 2, b.top + b.height / 2, 28);
    setEmail("");
  };

  return (
    <form onSubmit={submit} className="mt-5 flex max-w-sm gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(214,168,95,.45)]">
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email" aria-label="Email address"
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-sand/50"
      />
      <motion.button whileTap={{ scale: 0.94 }} disabled={state !== "idle"} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-primary-dark disabled:opacity-90">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={state} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="block">
            {state === "idle" ? "Subscribe" : state === "loading" ? "…" : "✓ Subscribed"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </form>
  );
}

export default function Footer() {
  const { contact, social } = siteConfig;
  return (
    <footer className="mt-20 bg-brand text-sand">
      <Container className="py-20 text-center">
        <h2 className="mx-auto max-w-2xl text-4xl font-semibold text-white md:text-5xl">Ready for your next adventure?</h2>
        <div className="mt-8">
          <Magnetic>
            <Link href="/tours" data-burst className="inline-flex rounded-full btn-gold px-6 py-2.5 text-sm font-semibold">
              Start Your Journey
            </Link>
          </Magnetic>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          <div>
            <p className="font-display text-2xl text-white">{siteConfig.name}</p>
            <p className="mt-3 max-w-xs text-sm text-sand/80">{siteConfig.tagline}</p>
            {contact.email && <p className="mt-4 text-sm">{contact.email}</p>}
            {contact.phone && <p className="text-sm">{contact.phone}</p>}
            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <motion.a
                  key={s.key} href={social[s.key] || "#"} aria-label={s.label}
                  whileHover={{ y: -4, rotate: 8, scale: 1.12 }} whileTap={{ scale: 0.92 }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-gold hover:text-gold"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </motion.a>
              ))}
            </div>
          </div>

          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold">{c.title}</p>
              <ul className="mt-4 space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="link-underline text-sm text-sand/90 hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Newsletter</p>
            <p className="mt-4 text-sm text-sand/80">Travel stories and offers, once a month.</p>
            <Newsletter />
          </div>
        </Container>
        <Container className="border-t border-white/10 py-5 text-xs text-sand/70">
          © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}