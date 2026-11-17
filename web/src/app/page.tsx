import { Hero, SearchStrip } from "@/components/home/hero";
import { RecentSales, ResultsBand } from "@/components/home/results";
import { ContactCta, Insights, Services, Testimonials, WatchSection } from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchStrip />
      <ResultsBand />
      <RecentSales />
      <Services />
      <WatchSection />
      <Testimonials />
      <Insights />
      <ContactCta />
    </>
  );
}
