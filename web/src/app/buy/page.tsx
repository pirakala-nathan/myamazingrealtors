import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { ContactCta } from "@/components/home/sections";
import { PageHeader } from "@/components/layout/page-header";
import { Steps } from "@/components/layout/steps";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Buy a Home",
  description: `Buying in Pickering, Ajax, Whitby, Oshawa, Scarborough or Markham? ${site.agent.name}, ${site.agent.title} with ${site.brokerage.name}, Brokerage, helps you find the right home and negotiate the best deal. English and Tamil.`,
  alternates: { canonical: "/buy" },
};

const steps = [
  {
    title: "Plan",
    body: "A no-pressure conversation about what you need, where, and your budget, plus getting your mortgage pre-approval lined up.",
  },
  {
    title: "Search",
    body: "New listings that match your search, sent as they come up, and honest notes on each home: value, layout and condition.",
  },
  {
    title: "Offer",
    body: "PK prices your offer against recent sales, sets sensible conditions and negotiates hard so you don’t overpay.",
  },
  {
    title: "Close",
    body: "Home inspection, lawyer, lender and closing day, coordinated so moving in is the only thing on your mind.",
  },
];

export default function BuyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Buying"
        title={
          <>
            Find the right home, at the right price<span className="text-aqua-700">.</span>
          </>
        }
      >
        <p>
          Whether it’s your first home, a bigger place for the family or an investment, {site.agent.firstName} brings 12+
          years of negotiating and hands-on building experience to every purchase.
        </p>
      </PageHeader>

      <section className="container-site flex flex-col gap-14 pb-20 md:pb-26">
        <Steps steps={steps} />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.02]">
              A builder’s eye on every showing
            </h2>
            <p className="text-[17px] leading-relaxed text-body">
              With experience building and developing homes, {site.agent.firstName} helps you see what photos don’t show:
              the quality of the construction and finishes, signs of trouble worth inspecting, and what updates would
              really cost. You’ll know what you’re buying before you make an offer.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.02]">
              Where {site.agent.firstName} works
            </h2>
            <p className="text-[17px] leading-relaxed text-body">
              {site.serviceAreas.join(", ")} and across the GTA. Service in English and Tamil.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact">Start your search</ButtonLink>
              <ButtonLink href="/our-listings" variant="secondary">
                See {site.agent.firstName}’s listings
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
