import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { ContactCta } from "@/components/home/sections";
import { PageHeader } from "@/components/layout/page-header";
import { Steps } from "@/components/layout/steps";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell Your Home",
  description: `Selling in Pickering, Ajax, Whitby, Oshawa, Scarborough or Markham? Get a free home evaluation and a selling plan from ${site.agent.name}, ${site.agent.title} with ${site.brokerage.name}, Brokerage.`,
  alternates: { canonical: "/sell" },
};

const steps = [
  {
    title: "Price",
    body: "A free evaluation based on recent sales near you and your home’s condition, with a clear pricing strategy.",
  },
  {
    title: "Prepare",
    body: "Practical advice on which repairs and touch-ups are worth doing before you list, and which aren’t.",
  },
  {
    title: "Market",
    body: "Professional photography and video, MLS® exposure and a marketing plan built for your home.",
  },
  {
    title: "Negotiate",
    body: "PK handles showings and offers and negotiates for the best price and terms, then sees it through to closing.",
  },
];

export default function SellPage() {
  return (
    <>
      <PageHeader
        eyebrow="Selling"
        title={
          <>
            Sell for more, with less stress<span className="text-aqua-700">.</span>
          </>
        }
      >
        <p>
          {site.agent.firstName} has sold 150+ homes over 12+ years. You get an honest price, a plan to present your home at
          its best, and a strong negotiator when the offers come in.
        </p>
      </PageHeader>

      <section className="container-site flex flex-col gap-14 pb-20 md:pb-26">
        <Steps steps={steps} />

        <div className="flex flex-col items-start gap-5 bg-aqua-400 p-8 text-navy-900 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-[clamp(2rem,3.6vw,2.75rem)] font-semibold leading-none">
              What’s your home worth?
            </h2>
            <p className="max-w-xl">A personal estimate from recent sales near you. Free, with no obligation to list.</p>
          </div>
          <ButtonLink href="/home-evaluation">Get my free evaluation</ButtonLink>
        </div>

        <div className="flex flex-col gap-4 lg:max-w-3xl">
          <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.02]">
            Know what buyers will notice
          </h2>
          <p className="text-[17px] leading-relaxed text-body">
            With a background in building and developing homes, {site.agent.firstName} walks through your home the way a
            careful buyer will, and tells you plainly what matters: finishes, repairs and the small fixes that pay for
            themselves. No upsell, just what helps you sell.
          </p>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
