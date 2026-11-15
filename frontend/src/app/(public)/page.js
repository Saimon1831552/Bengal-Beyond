import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getDestinations, getTours, getPosts } from "@/services/content";
import { splitTours, trendingDestinations, blogCards } from "@/components/landing/data";

import Reveal from "@/components/Reveal";
import Hero3DLoader from "@/components/Hero3DLoader";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import WhyChoose from "@/components/landing/WhyChoose";
import HolidayTours from "@/components/landing/HolidayTours";
import ShortTours from "@/components/landing/ShortTours";
import DayTours from "@/components/landing/DayTours";
import Stats from "@/components/landing/Stats";
import Testimonials from "@/components/landing/Testimonials";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import Trending from "@/components/landing/Trending";
import Blogs from "@/components/landing/Blogs";
import Heritage from "@/components/landing/Heritage";
import Gallery from "@/components/landing/Gallery";
import DepthScene from "@/components/landing/DepthScene";

export const metadata = buildMetadata({
  title: { absolute: `${siteConfig.name} | Bangladesh Tours & Travel Experiences` },
  description: siteConfig.description,
  path: "/",
});

export const revalidate = 3600;

const safe = async (fn) => { try { return await fn(); } catch { return []; } };

export default async function HomePage() {
  const [destinations, tours, posts] = await Promise.all([safe(getDestinations), safe(getTours), safe(getPosts)]);
  const { holiday, short, day } = splitTours(tours);

  return (
    <main>
      <Hero destinations={destinations} />
      <Hero3DLoader />
      <Reveal><About /></Reveal>
      <DepthScene />
      <Reveal><WhyChoose /></Reveal>
      <Reveal><HolidayTours tours={holiday} /></Reveal>
      <Reveal><ShortTours tours={short} /></Reveal>
      <Reveal><DayTours tours={day} /></Reveal>
      <Reveal><Stats /></Reveal>
      <Reveal><Testimonials /></Reveal>
      <Reveal><FeatureShowcase /></Reveal>
      <Reveal><Trending destinations={trendingDestinations(destinations)} /></Reveal>
      <Reveal><Blogs posts={blogCards(posts)} /></Reveal>
      <Reveal><Heritage /></Reveal>
      <Reveal><Gallery /></Reveal>
    </main>
  );
}