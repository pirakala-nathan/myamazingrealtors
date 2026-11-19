import { HouseLoader } from "@/components/ui/house-loader";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/layout/page-header";
import { ListingCard } from "@/components/listings/listing-card";
import { SearchPanel } from "@/components/listings/search-panel";
import { searchableListings } from "@/components/listings/searchable";
import { describeFilters, hasFilters, locationOptions, matchesFilters, parseFilters, toFilterable, typeOptions } from "@/lib/listings/filters";
import { getListings } from "@/lib/listings/store";
import { isPublic, type Listing } from "@/lib/listings/types";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "PK’s Listings",
  description: `Homes for sale and recently sold by ${site.agent.name}, Realtor® with ${site.brokerage.name}, in Pickering, Ajax, Whitby, Oshawa, Scarborough and Markham.`,
  alternates: { canonical: "/our-listings" },
};

function Grid({ listings }: { listings: Listing[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <li key={l.mlsNumber}>
          <ListingCard listing={l} />
        </li>
      ))}
    </ul>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/our-listings">["searchParams"] }) {
  const filters = parseFilters(await searchParams);
  const all = await getListings();
  const filtering = hasFilters(filters);
  const shown = all.filter(isPublic);
  const listings = filtering ? shown.filter((l) => matchesFilters(toFilterable(l), filters)) : shown;
  const current = listings.filter((l) => l.status === "active" || l.status === "pending");
  const past = listings.filter((l) => l.status === "sold" || l.status === "leased");
  const offMarket = listings.filter((l) => l.status === "off-market");
  const offMarketTotal = shown.filter((l) => l.status === "off-market").length;
  const showingOffMarket = filters.show === "off-market";

  return (
    <>
      <SearchPanel
        listings={searchableListings(all)}
        types={typeOptions(all)}
        cities={site.serviceAreas}
        locations={locationOptions(all, site.serviceAreas)}
        firstName={site.agent.firstName}
        initial={filters}
      />

      {filtering && (
        <p className="-mt-8 text-body">
          {listings.length === 0 ? "No listings" : `${listings.length} listing${listings.length === 1 ? "" : "s"}`} matching{" "}
          {describeFilters(filters)}.{" "}
          <Link href="/our-listings" className="font-bold text-aqua-700 underline">
            Clear filters
          </Link>
        </p>
      )}

      {filters.show === "sold" || showingOffMarket ? null : current.length > 0 ? (
        <Grid listings={current} />
      ) : (
        <div className="flex flex-col items-start gap-4 border border-cloud-300 bg-mist-50 p-8 md:p-10">
          <h2 className="font-display text-3xl font-semibold">
            {filtering ? "Nothing for sale matches that search right now." : "New listings are on the way."}
          </h2>
          <p className="max-w-xl text-body">
            Tell {site.agent.firstName} what you’re looking for and get new listings that match, including homes not
            listed here.
          </p>
          <ButtonLink href="/contact">Contact {site.agent.firstName}</ButtonLink>
        </div>
      )}

      {filters.show !== "for-sale" && !showingOffMarket && past.length > 0 && (
        <div className="flex flex-col gap-8">
          <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-none">Recently sold.</h2>
          <Grid listings={past} />
        </div>
      )}

      {showingOffMarket &&
        (offMarket.length > 0 ? (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-none">Off market.</h2>
              <p className="max-w-2xl text-body">
                Homes that are no longer listed for sale. Interested in one of them, or something like it? Ask{" "}
                {site.agent.firstName}, who may be able to reach the owner or find you something similar.
              </p>
            </div>
            <Grid listings={offMarket} />
          </div>
        ) : (
          <p className="border border-cloud-300 bg-mist-50 p-8 text-body">No off-market homes match that search.</p>
        ))}

      {/* A way in to off-market homes, which the main list leaves out. */}
      {!showingOffMarket && offMarketTotal > 0 && (
        <Link
          href="/our-listings?show=off-market"
          className="self-start border-b-2 border-aqua-400 pb-1 font-extrabold text-ink hover:text-aqua-700"
        >
          See {offMarketTotal} off-market home{offMarketTotal === 1 ? "" : "s"} →
        </Link>
      )}
    </>
  );
}

export default function OurListingsPage({ searchParams }: PageProps<"/our-listings">) {
  return (
    <>
      <PageHeader
        eyebrow="Listings"
        title={
          <>
            {site.agent.firstName}’s listings<span className="text-aqua-700">.</span>
          </>
        }
      >
        <p>Homes {site.agent.firstName} is marketing right now, and recent sales across Durham and the East GTA.</p>
      </PageHeader>

      <section className="container-site flex flex-col gap-16 pb-20 md:pb-26">
        <Suspense fallback={<HouseLoader label="Loading listings" className="py-16" />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}
