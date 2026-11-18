import { ContactStrip, Hero, SearchSection } from "@/components/home/hero";
import { RecentSales, ResultsBand } from "@/components/home/results";
import { ContactCta, Services, Testimonials, WatchSection } from "@/components/home/sections";

// Homepage layout: Direction C, "Light & Airy" (chosen 2026-11-18, see docs/02-design-system.md).
export default function HomePage() {
  return (
    <>
      <Hero />
      <ContactStrip />
      <Services />
      <SearchSection />
      <ResultsBand />
      <RecentSales />
      <WatchSection />
      <Testimonials />
      {/* <Insights /> returns once PK publishes articles or market reports (lib/content/home.ts). */}
      <ContactCta />
    </>
  );
}
