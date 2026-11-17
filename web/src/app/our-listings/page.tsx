import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/layout/page-header";
import { ListingCard } from "@/components/listings/listing-card";
import { getListings } from "@/lib/listings/store";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "PK’s Listings",
  description: `Homes for sale and recently sold by ${site.agent.name}, Realtor® with ${site.brokerage.name}, in Pickering, Ajax, Whitby, Oshawa, Scarborough and Markham.`,
  alternates: { canonical: "/our-listings" },
};

export default async function OurListingsPage() {
  const listings = await getListings();
  const current = listings.filter((l) => l.status === "active" || l.status === "pending");
  const past = listings.filter((l) => l.status === "sold" || l.status === "leased");

  return (
    <>
      <PageHeader
        eyebrow="Listings"
        title={
          <>
            {site.agent.firstName}’s listings<span className="text-champagne-700">.</span>
          </>
        }
      >
        <p>Homes {site.agent.firstName} is marketing right now, and recent sales across Durham and the East GTA.</p>
      </PageHeader>

      <section className="container-site flex flex-col gap-16 pb-20 md:pb-26">
        {current.length > 0 ? (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {current.map((l) => (
              <li key={l.mlsNumber}>
                <ListingCard listing={l} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4 border border-stone-300 bg-ivory-50 p-8 md:p-10">
            <h2 className="font-display text-3xl font-semibold">New listings are on the way.</h2>
            <p className="max-w-xl text-body">
              Want to hear about {site.agent.firstName}’s next listing before it hits the market? Get in touch.
            </p>
            <ButtonLink href="/contact">Contact {site.agent.firstName}</ButtonLink>
          </div>
        )}

        {past.length > 0 && (
          <div className="flex flex-col gap-8">
            <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-none">Recently sold.</h2>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((l) => (
                <li key={l.mlsNumber}>
                  <ListingCard listing={l} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
