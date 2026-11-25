"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import Container from "@/components/ui/Container";
import ShaderCanvas from "@/components/fx/ShaderCanvas";
import KineticHeading from "@/components/fx/KineticHeading";
import MorphWord from "@/components/fx/MorphWord";
import { FLUID } from "@/lib/shaders";
import { img } from "./data";

const WORDS = ["Bengal Beyond", "the Sundarbans", "Sajek Valley", "Cox's Bazar", "Tea Country"];
const EASE = [0.22, 1, 0.36, 1];
const field = "w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-sm text-primary-dark outline-none transition focus:border-accent";

function Depth({ sx, sy, k, className, children }) {
  const x = useTransform(sx, [-0.5, 0.5], [k, -k]);
  const y = useTransform(sy, [-0.5, 0.5], [k * 0.7, -k * 0.7]);
  return <motion.div style={{ x, y }} className={className}>{children}</motion.div>;
}

export default function Hero({ destinations = [], tourCount = 0 }) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 36, damping: 20 });
  const sy = useSpring(my, { stiffness: 36, damping: 20 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [form, setForm] = useState({ destination: "", date: "", guests: "" });
  const photo = img(1, 1800);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (form.destination) p.set("destinationId", form.destination);
    if (form.date) {
      p.set("departureFrom", form.date);
      p.set("departureTo", form.date);
    }
    if (form.guests) p.set("guests", form.guests);
    router.push(`/tours?${p.toString()}`);
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col justify-between md:block md:min-h-screen"
      onMouseMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      {/* Background photo + shader */}
      <div className="absolute inset-0 overflow-hidden bg-primary-dark">
        <motion.div
          style={{ y: bgY }}
          initial={{ scale: 1.12, opacity: 0.7 }}
          animate={{ scale: 1.02, opacity: 1 }}
          transition={{ duration: 1.8, ease: EASE }}
          className="absolute inset-0"
        >
          <Image src={photo} alt="" fill priority sizes="100vw" className="object-cover" />
        </motion.div>
        <ShaderCanvas frag={FLUID} src={photo} dprMax={1.25} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary-dark/80 via-primary-dark/30 to-primary-dark/90" />
      </div>

      {/* Main Hero Copy */}
      <Container className="relative z-10 pb-8 pt-28 sm:pt-32 md:pb-48 md:pt-36 lg:pt-40">
        <motion.div style={{ y: contentY, opacity: contentOpacity }}>
          <Depth sx={sx} sy={sy} k={-10}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: EASE }}
              className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur-md sm:px-4 sm:text-xs sm:tracking-[0.25em]"
            >
              <span>Premium Guided Tours of Bangladesh</span>
              {tourCount > 0 && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] text-primary-dark">
                  {tourCount} Journeys
                </span>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
              className="mt-4 text-4xl font-semibold leading-[1.04] text-white sm:mt-5 sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              <span className="sr-only">Discover Bengal Beyond</span>
              <span aria-hidden="true" className="block"><KineticHeading text="Discover" /></span>
              <span aria-hidden="true" className="block"><MorphWord words={WORDS} className="text-gradient" /></span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
              className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:mt-6 sm:text-base md:text-lg"
            >
              Private mangrove expeditions, misty tea hills, ancient terracotta ruins, and island coastlines—crafted by local specialists.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.36, ease: EASE }}
              className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7"
            >
              <Link
                href="/tours"
                className="btn-gold rounded-full px-6 py-3 text-xs font-semibold shadow-lg transition-transform duration-300 hover:-translate-y-0.5 sm:px-7 sm:py-3.5 sm:text-sm"
              >
                Browse All Tours
              </Link>
              <a
                href="#explore-map"
                className="rounded-full border border-white/35 bg-white/10 px-5 py-3 text-xs font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/20 sm:px-6 sm:py-3.5 sm:text-sm"
              >
                Interactive Region Map ↓
              </a>
            </motion.div>

            {destinations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.48, ease: EASE }}
                className="mt-6 flex flex-wrap items-center gap-2 sm:mt-7"
              >
                <span className="text-xs uppercase tracking-wider text-white/65">Popular:</span>
                {destinations.slice(0, 4).map((d) => (
                  <Link
                    key={d.slug}
                    href={`/destinations/${d.slug}`}
                    className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-xs transition duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                  >
                    {d.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </Depth>
        </motion.div>
      </Container>

      {/* Floating glass chips (Laptop & PC only) */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block" aria-hidden="true">
        <Depth sx={sx} sy={sy} k={40} className="absolute right-[8%] top-[24%] xl:right-[10%]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.35, ease: EASE }}
            className="glass-deep animate-float rounded-2xl px-5 py-3 text-sm font-semibold text-white"
          >
            ✦ Local guides
          </motion.div>
        </Depth>
        <Depth sx={sx} sy={sy} k={70} className="absolute right-[18%] top-[44%] xl:right-[22%]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.5, ease: EASE }}
            className="glass-deep animate-float rounded-2xl px-5 py-3 text-sm font-semibold text-white [animation-delay:-1.5s]"
          >
            🌿 Small groups
          </motion.div>
        </Depth>
        <Depth sx={sx} sy={sy} k={25} className="absolute right-[5%] top-[58%] xl:right-[6%]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.65, ease: EASE }}
            className="glass-deep animate-float rounded-2xl px-5 py-3 text-sm font-semibold text-white [animation-delay:-3s]"
          >
            🔒 Flexible 30% deposit
          </motion.div>
        </Depth>
      </div>

      {/* Responsive Search Bar: inline card on mobile, floating overlapping dock on tablet/laptop/PC */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.42, ease: EASE }}
        className="relative z-20 mx-auto w-full max-w-5xl px-4 pb-8 md:absolute md:inset-x-4 md:bottom-0 md:translate-y-1/2 md:pb-0"
      >
        <div className="hidden md:block">
          <div className="absolute inset-x-10 top-3 h-full rounded-3xl bg-white/25" />
          <div className="absolute inset-x-16 top-6 h-full rounded-3xl bg-white/15" />
        </div>
        <form
          onSubmit={submit}
          className="glass-deep relative grid gap-3 rounded-3xl bg-white/85 p-4 shadow-2xl sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end"
        >
          <label className="text-xs font-semibold uppercase tracking-wide text-primary sm:col-span-2 md:col-span-1">
            Destination
            <select
              className={`mt-1 ${field}`}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            >
              <option value="">Anywhere in Bangladesh</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-primary">
            Dates
            <input
              type="date"
              className={`mt-1 ${field}`}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-primary">
            Guests
            <select
              className={`mt-1 ${field}`}
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
            >
              <option value="">Any</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} {i ? "guests" : "guest"}</option>
              ))}
            </select>
          </label>
          <button
            data-burst
            className="btn-gold w-full rounded-xl px-8 py-3 text-sm font-semibold transition-transform duration-300 hover:scale-[1.02] sm:col-span-2 md:col-span-1 md:w-auto"
          >
            Search
          </button>
        </form>
      </motion.div>
    </section>
  );
}