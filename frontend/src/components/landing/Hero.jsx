"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Container from "@/components/ui/Container";
import ShaderCanvas from "@/components/fx/ShaderCanvas";
import KineticHeading from "@/components/fx/KineticHeading";
import MorphWord from "@/components/fx/MorphWord";
import { FLUID } from "@/lib/shaders";
import { img } from "./data";

const WORDS = ["Bengal Beyond", "the Sundarbans", "Sajek Valley", "Cox's Bazar", "Tea Country"];
const field = "w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-sm text-primary-dark outline-none focus:border-accent";

function Depth({ sx, sy, k, className, children }) {
  const x = useTransform(sx, [-0.5, 0.5], [k, -k]);
  const y = useTransform(sy, [-0.5, 0.5], [k * 0.7, -k * 0.7]);
  return <motion.div style={{ x, y }} className={className}>{children}</motion.div>;
}

export default function Hero({ destinations = [] }) {
  const router = useRouter();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const [form, setForm] = useState({ destination: "", date: "", guests: "2" });
  const photo = img(1, 1800);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (form.destination) p.set("destinationId", form.destination);
    if (form.date) {
      p.set("departureFrom", form.date);
      p.set("departureTo", form.date);
    }
    p.set("guests", form.guests);
    router.push(`/tours?${p.toString()}`);
  };

  return (
    <section
      className="relative flex min-h-screen items-center"
      onMouseMove={(e) => { mx.set(e.clientX / window.innerWidth - 0.5); my.set(e.clientY / window.innerHeight - 0.5); }}
    >
      <div className="absolute inset-0 overflow-hidden bg-primary-dark">
        <Image src={photo} alt="" fill priority sizes="100vw" className="object-cover" />
        <ShaderCanvas frag={FLUID} src={photo} dprMax={1.25} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary-dark/70 via-primary-dark/20 to-primary-dark/80" />
      </div>

      <Container className="relative z-10 pb-40 pt-24">
        <Depth sx={sx} sy={sy} k={-10}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Premium guided tours of Bangladesh</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] text-white sm:text-6xl md:text-8xl">
            <span className="sr-only">Discover Bengal Beyond</span>
            <span aria-hidden="true" className="block"><KineticHeading text="Discover" /></span>
            <span aria-hidden="true" className="block"><MorphWord words={WORDS} className="text-gradient" /></span>
          </h1>
        </Depth>
      </Container>

      {/* floating glass chips, each on its own depth plane */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block" aria-hidden="true">
        <Depth sx={sx} sy={sy} k={40} className="absolute right-[10%] top-[24%]">
          <div className="glass-deep animate-float rounded-2xl px-5 py-3 text-sm font-semibold text-white">✦ Local guides</div>
        </Depth>
        <Depth sx={sx} sy={sy} k={70} className="absolute right-[22%] top-[44%]">
          <div className="glass-deep animate-float rounded-2xl px-5 py-3 text-sm font-semibold text-white [animation-delay:-1.5s]">🌿 Small groups</div>
        </Depth>
        <Depth sx={sx} sy={sy} k={25} className="absolute right-[6%] top-[58%]">
          <div className="glass-deep animate-float rounded-2xl px-5 py-3 text-sm font-semibold text-white [animation-delay:-3s]">🔒 Secure payments</div>
        </Depth>
      </div>

      {/* stacked-glass booking widget */}
      <div className="absolute inset-x-4 bottom-0 z-20 mx-auto max-w-5xl translate-y-1/2">
        <div className="absolute inset-x-6 top-3 h-full rounded-3xl bg-white/25" />
        <div className="absolute inset-x-12 top-6 h-full rounded-3xl bg-white/15" />
        <form onSubmit={submit} className="glass-deep relative grid gap-3 rounded-3xl bg-white/70 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
          <label className="text-xs font-semibold uppercase tracking-wide text-primary">Destination
            <select className={`mt-1 ${field}`} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}>
              <option value="">Anywhere in Bangladesh</option>
              {destinations.map((d) => <option key={d.slug} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-primary">Dates
            <input type="date" className={`mt-1 ${field}`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-primary">Guests
            <select className={`mt-1 ${field}`} value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })}>
              {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i ? "guests" : "guest"}</option>)}
            </select>
          </label>
          <button data-burst className="btn-gold rounded-xl px-8 py-3 text-sm font-semibold">Search</button>
        </form>
      </div>
    </section>
  );
}