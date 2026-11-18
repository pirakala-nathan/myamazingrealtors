import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { heroStats, recentSales } from "@/lib/content/home";
import { formatRating, getGoogleReviews } from "@/lib/google-reviews";
import { getListings } from "@/lib/listings/store";
import { listingTitle, statusLabel } from "@/lib/listings/types";
import { HeroSearch, type SearchableListing } from "@/components/home/hero-search";
import { ListingSpotlight, type SpotlightListing } from "@/components/home/listing-spotlight";
import type { Listing } from "@/lib/listings/types";
import { Reveal } from "@/components/home/reveal";
import { isOverAsking } from "@/components/listings/status-badge";
import { priceLine } from "@/components/listings/listing-card";

/** Direction C, "Light & Airy": serif headline, circular portrait and a stats column. */
export async function Hero() {
  const [google, all] = await Promise.all([getGoogleReviews(), getListings()]);
  const searchable: SearchableListing[] = [...all]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((l) => {
      const over = isOverAsking(l);
      return {
        key: l.mlsNumber,
        href: `/listings/${l.slug}`,
        src: l.photos[0] ?? null,
        title: l.street ?? l.city,
        place: [l.city, l.propertyType].filter(Boolean).join(" · "),
        status: over ? "Over asking" : statusLabel[l.status],
        over,
        haystack: [l.street, l.city, l.postalCode, l.mlsNumber, l.propertyType].filter(Boolean).join(" ").toLowerCase(),
      };
    });
  const counts = listingCounts(all);
  const stats = heroStats.map((s) =>
    s.label === "Google rating" && google ? { ...s, value: formatRating(google.rating) } : s,
  );
  return (
    // Clips sideways only, so the search results can drop down over the section below.
    <section className="relative z-20 overflow-x-clip bg-mist-100">
      <div className="container-site grid items-center gap-10 pb-4 pt-10 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)_180px] lg:gap-12">
        <div className="flex flex-col gap-6">
          <p className="eyebrow text-aqua-700">
            {site.agent.name} · Realtor®
          </p>
          <h1 className="font-display text-[clamp(3.25rem,6.6vw,5.25rem)] font-semibold leading-[0.96] tracking-[-0.01em]">
            Your next move, made simple<span className="text-aqua-400">.</span>
          </h1>
          <p className="max-w-[460px] text-lg leading-relaxed text-body">{site.agent.intro}</p>
          <HeroSearch listings={searchable} cities={site.serviceAreas} firstName={site.agent.firstName} counts={counts} />
        </div>

        <div className="relative mx-auto w-full max-w-[420px] p-4 sm:p-5">
          <div aria-hidden="true" className="absolute inset-0 rounded-full border border-navy-900" />
          <div aria-hidden="true" className="absolute right-0 top-[4%] h-[62%] w-[62%] rounded-full bg-aqua-400" />
          <div className="relative aspect-square overflow-hidden rounded-full">
            <Image
              src={site.agent.photo}
              alt={`Portrait of ${site.agent.name}`}
              fill
              preload
              sizes="(min-width: 1024px) 420px, 90vw"
              className="object-cover object-[center_15%]"
            />
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5">
              <dt className="text-sm font-semibold text-body">{s.label}</dt>
              <dd className="order-first font-display text-[40px] font-semibold leading-none sm:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Navy strip under the hero: call/text, office and the home evaluation call to action. */
export function ContactStrip() {
  const { office, agent } = site;
  return (
    <section className="bg-mist-100 pt-10 md:pt-14">
      <div className="container-site">
        <div className="grid bg-navy-900 text-on-dark md:grid-cols-3">
          <a href={agent.phoneHref} className="flex flex-col gap-1.5 border-b border-navy-600 px-7 py-6 hover:bg-navy-800 md:border-b-0 md:border-r">
            <span className="eyebrow text-xs text-on-dark-subtle">Call or text</span>
            <span className="text-xl font-extrabold">{agent.phone}</span>
          </a>
          <div className="flex flex-col gap-1.5 border-b border-navy-600 px-7 py-6 md:border-b-0 md:border-r">
            <span className="eyebrow text-xs text-on-dark-subtle">Office</span>
            <span className="font-semibold">
              {office.street}, {office.city}
            </span>
          </div>
          <Link
            href="/home-evaluation"
            className="flex min-h-20 items-center justify-between gap-3 bg-aqua-400 px-7 py-6 text-navy-900 hover:bg-aqua-300"
          >
            <span className="text-lg font-extrabold">What’s my home worth?</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Showcase for the search section: the newest listings PK has added (any status, newest first),
 * topped up with the sample sales until there are at least three.
 */
async function spotlightListings(): Promise<{ items: SpotlightListing[]; forSale: number; sold: number }> {
  const all = await getListings();
  const items: SpotlightListing[] = all
    .filter((l) => l.photos.length > 0)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, 6)
    .map((l) => {
      const over = isOverAsking(l);
      return {
        key: l.mlsNumber,
        src: l.photos[0],
        alt: `${listingTitle(l)}, ${statusLabel[l.status].toLowerCase()}`,
        href: `/listings/${l.slug}`,
        title: l.street ?? l.city,
        place: [l.city, l.propertyType].filter(Boolean).join(" · "),
        status: over ? (l.status === "leased" ? "Leased over asking" : "Sold over asking") : statusLabel[l.status],
        over,
        price: priceLine(l),
      };
    });
  const samples: SpotlightListing[] = recentSales.map((s) => ({
    key: s.address,
    src: s.image,
    alt: s.imageAlt,
    href: null,
    title: s.address,
    place: s.city.startsWith("[") ? "Durham & East GTA" : s.city,
    status: s.status === "sold-over-asking" ? "Sold over asking" : "Leased over asking",
    over: true,
    price: null,
  }));
  return { items: items.length >= 3 ? items : [...items, ...samples].slice(0, Math.max(3, items.length)), ...listingCounts(all) };
}

function listingCounts(all: Listing[]) {
  return {
    forSale: all.filter((l) => l.status === "active" || l.status === "pending").length,
    sold: all.filter((l) => l.status === "sold" || l.status === "leased").length,
  };
}

/** "Latest listings": PK's newest listings and sales, rotating in the animated spotlight. Search lives in the hero. */
export async function LatestListings() {
  const { items, forSale, sold } = await spotlightListings();
  return (
    <section className="relative overflow-hidden bg-mist-100 py-20 md:py-26">
      {/* A large, faint logo-cyan block behind the photos gives the section depth. */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[38%] bg-aqua-100 lg:block" />
      <Reveal className="container-site relative grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="flex flex-col">
          <p className="eyebrow text-aqua-700">Listings</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,3.75rem)] font-semibold leading-[1.02]">
            {site.agent.firstName}’s latest listings<span className="text-aqua-400">.</span>
          </h2>
          <p className="mt-5 max-w-[460px] text-base leading-relaxed text-body">
            Homes {site.agent.firstName} is selling now and recent sales across Durham and the East GTA. Looking for
            something else? {site.agent.firstName} can send you new listings that match your search.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-cloud-300 pt-5 text-sm">
            {forSale + sold > 0 && (
              <span className="text-body">
                <strong className="font-display text-2xl font-semibold text-ink">{forSale}</strong> for sale ·{" "}
                <strong className="font-display text-2xl font-semibold text-ink">{sold}</strong> recently sold
              </span>
            )}
            <Link href="/our-listings" className="font-extrabold text-aqua-700 hover:text-navy-900">
              See all listings →
            </Link>
          </div>
        </div>

        <ListingSpotlight listings={items} />
      </Reveal>
    </section>
  );
}
