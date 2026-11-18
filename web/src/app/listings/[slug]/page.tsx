import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { factsLine, isRemote, priceLine } from "@/components/listings/listing-card";
import { getListingBySlug } from "@/lib/listings/store";
import { listingTitle, statusLabel } from "@/lib/listings/types";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/listings/[slug]">): Promise<Metadata> {
  const listing = await getListingBySlug((await params).slug);
  if (!listing) return { title: "Listing not found" };
  const title = `${listingTitle(listing)} | ${statusLabel[listing.status]}`;
  return {
    title,
    description: `${factsLine(listing)} in ${listing.city}. MLS® ${listing.mlsNumber}. Listed with ${site.agent.name}, ${site.brokerage.name}.`,
    alternates: { canonical: `/listings/${listing.slug}` },
    openGraph: listing.photos[0] ? { images: [listing.photos[0]] } : undefined,
  };
}

function Fact({ label, value }: { label: string; value: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col gap-1 border-t border-cloud-300 py-4">
      <dt className="eyebrow text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

async function ListingDetail({ params }: { params: PageProps<"/listings/[slug]">["params"] }) {
  const listing = await getListingBySlug((await params).slug);
  if (!listing) notFound();

  const price = priceLine(listing);
  const [hero, ...rest] = listing.photos;
  const title = listingTitle(listing);

  return (
    <article className="flex flex-col gap-10 pb-20 pt-8 md:pb-26">
      <div className="container-site flex flex-col gap-4">
        <Link href="/our-listings" className="text-sm font-bold text-muted hover:text-aqua-700">
          ← All listings
        </Link>
        <p className="eyebrow text-aqua-700">
          {statusLabel[listing.status]} · {listing.city}
        </p>
        <h1 className="font-display text-[clamp(2.5rem,5.4vw,4.75rem)] font-semibold leading-[0.95]">{title}</h1>
        <p className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          {price && <span className="font-display text-4xl font-semibold">{price}</span>}
          <span className="text-body">{factsLine(listing)}</span>
        </p>
      </div>

      {hero && (
        <div className="container-site grid gap-2 md:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[4/3] bg-cloud-300 md:row-span-2">
            <Image
              src={hero}
              alt={`Front of ${title}`}
              fill
              preload
              sizes="(min-width: 768px) 66vw, 100vw"
              unoptimized={isRemote(hero)}
              className="object-cover"
            />
          </div>
          {rest.slice(0, 2).map((src, i) => (
            <div key={src} className="relative hidden aspect-[4/3] bg-cloud-300 md:block">
              <Image
                src={src}
                alt={`${title}, photo ${i + 2}`}
                fill
                sizes="33vw"
                unoptimized={isRemote(src)}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="container-site grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-8">
          {listing.description && (
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-3xl font-semibold">About this home</h2>
              <p className="whitespace-pre-line text-[17px] leading-relaxed text-body">{listing.description}</p>
            </div>
          )}

          <dl className="grid gap-x-8 sm:grid-cols-2">
            <Fact label="Bedrooms" value={listing.bedrooms} />
            <Fact label="Bathrooms" value={listing.bathrooms} />
            <Fact label="Property type" value={listing.propertyType} />
            <Fact label="Size (sq ft)" value={listing.sizeRange} />
            <Fact label="City" value={listing.city} />
            <Fact label="MLS® number" value={listing.mlsNumber} />
          </dl>

          {rest.length > 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-3xl font-semibold">Photos</h2>
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {rest.slice(2).map((src, i) => (
                  <li key={src} className="relative aspect-[4/3] bg-cloud-300">
                    <Image
                      src={src}
                      alt={`${title}, photo ${i + 4}`}
                      fill
                      sizes="(min-width: 768px) 22vw, 50vw"
                      unoptimized={isRemote(src)}
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 self-start bg-navy-900 p-8 text-on-dark-muted lg:sticky lg:top-28">
          <h2 className="font-display text-3xl font-semibold text-on-dark">
            {listing.status === "active" ? "Want to see it?" : "Thinking of selling?"}
          </h2>
          <p className="leading-relaxed">
            {listing.status === "active"
              ? `Book a showing or ask ${site.agent.firstName} anything about this home.`
              : `${site.agent.firstName} can tell you what this sale means for your home’s value.`}
          </p>
          <ButtonLink href={listing.status === "active" ? "/contact" : "/home-evaluation"} variant="accent">
            {listing.status === "active" ? "Book a showing" : "What’s my home worth?"}
          </ButtonLink>
          <a
            href={site.agent.phoneHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-on-dark px-6 font-bold text-on-dark hover:bg-on-dark hover:text-navy-900"
          >
            Call {site.agent.phone}
          </a>
        </aside>
      </div>

      <p className="container-site text-[13px] leading-relaxed text-muted">
        MLS® {listing.mlsNumber}. Listing courtesy of {listing.listOffice ?? site.brokerage.name}, Brokerage. Information
        is deemed reliable but not guaranteed. Last updated {new Date(listing.fetchedAt).toLocaleDateString("en-CA")}.
      </p>
    </article>
  );
}

export default function ListingPage({ params }: PageProps<"/listings/[slug]">) {
  return (
    <Suspense fallback={<div className="container-site min-h-[60vh] py-16 text-muted">Loading listing…</div>}>
      <ListingDetail params={params} />
    </Suspense>
  );
}
