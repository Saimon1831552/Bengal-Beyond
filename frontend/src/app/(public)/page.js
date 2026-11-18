import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getDestinations, getTours, getPosts, getGallery, getHighlights } from "@/services/content";
import { splitTours, trendingDestinations, blogCards } from "@/components/landing/data";

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
  const [destinations, tours, posts, gallery, hl] = await Promise.all([
    safe(getDestinations), safe(getTours), safe(getPosts), getGallery(9), getHighlights(),
  ]);
  const { holiday, short, day } = splitTours(tours);
  const reviews = hl.reviews.map((r) => ({ id: r.id, name: r.name, place: r.tourTitle, stars: r.rating, text: r.text }));
  const s = hl.stats;
  const stats = s ? [
    { to: s.travellers, label: "Happy travellers" },
    { to: s.tours, label: "Tours to choose from" },
    { to: s.reviews, label: "Traveller reviews" },
  ].filter((x) => x.to > 0).map((x) => ({ ...x, suffix: "" })) : [];

  return (
    <main>
      <Hero destinations={destinations} />
      <About />
      <DepthScene />
      <WhyChoose />
      <HolidayTours tours={holiday} />
      <ShortTours tours={short} />
      <DayTours tours={day} />
      <Stats stats={stats} />
      <Testimonials reviews={reviews} />
      <FeatureShowcase />
      <Trending destinations={trendingDestinations(destinations)} />
      <Blogs posts={blogCards(posts)} />
      <Heritage />
      <Gallery items={gallery} />
    </main>
  );
}