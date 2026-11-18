import { HouseLoader } from "@/components/ui/house-loader";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/layout/page-header";
import { ListingCard } from "@/components/listings/listing-card";
import { getListings } from "@/lib/listings/store";
import type { Listing } from "@/lib/listings/types";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "PK’s Listings",
  description: `Homes for sale and recently sold by ${site.agent.name}, Realtor® with ${site.brokerage.name}, in Pickering, Ajax, Whitby, Oshawa, Scarborough and Markham.`,
  alternates: { canonical: "/our-listings" },
};

/** Matches a search against the street, city, postal code, MLS® number and property type. */
function matches(l: Listing, q: string) {
  const haystack = [l.street, l.city, l.postalCode, l.mlsNumber, l.propertyType].filter(Boolean).join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

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

function SearchBox({ q }: { q: string }) {
  return (
    <form action="/our-listings" method="get" role="search" className="flex max-w-[560px] flex-col gap-3 sm:flex-row sm:gap-0">
      <label htmlFor="listings-search" className="sr-only">
        Search {site.agent.firstName}’s listings by city, street or MLS® number
      </label>
      <input
        id="listings-search"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="City, street or MLS®#"
        className="min-h-13 min-w-0 flex-1 rounded-none border border-cloud-400 bg-white px-5 text-base text-ink placeholder:text-muted"
      />
      <button type="submit" className="min-h-13 rounded-none bg-navy-900 px-7 font-extrabold text-on-dark hover:bg-navy-700 hover:text-aqua-300">
        Search
      </button>
    </form>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/our-listings">["searchParams"] }) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 80);
  const all = await getListings();
  const listings = q ? all.filter((l) => matches(l, q)) : all;
  const current = listings.filter((l) => l.status === "active" || l.status === "pending");
  const past = listings.filter((l) => l.status === "sold" || l.status === "leased");

  return (
    <>
      <SearchBox q={q} />

      {q && (
        <p className="-mt-8 text-body">
          {listings.length === 0 ? "No listings" : `${listings.length} listing${listings.length === 1 ? "" : "s"}`} matching “
          {q}”.{" "}
          <Link href="/our-listings" className="font-bold text-aqua-700 underline">
            Show all
          </Link>
        </p>
      )}

      {current.length > 0 ? (
        <Grid listings={current} />
      ) : (
        <div className="flex flex-col items-start gap-4 border border-cloud-300 bg-mist-50 p-8 md:p-10">
          <h2 className="font-display text-3xl font-semibold">
            {q ? "Nothing for sale matches that search right now." : "New listings are on the way."}
          </h2>
          <p className="max-w-xl text-body">
            Tell {site.agent.firstName} what you’re looking for and get new listings that match, including homes not
            listed here.
          </p>
          <ButtonLink href="/contact">Contact {site.agent.firstName}</ButtonLink>
        </div>
      )}

      {past.length > 0 && (
        <div className="flex flex-col gap-8">
          <h2 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-none">Recently sold.</h2>
          <Grid listings={past} />
        </div>
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
