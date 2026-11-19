import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { heroStats, recentSales } from "@/lib/content/home";
import { formatRating, getGoogleReviews } from "@/lib/google-reviews";
import { getListings } from "@/lib/listings/store";
import { isPastDeal, statusLabel } from "@/lib/listings/types";
import { SearchPanel } from "@/components/listings/search-panel";
import { searchableListings } from "@/components/listings/searchable";
import { locationOptions, typeOptions } from "@/lib/listings/filters";
import { ListingsCarousel, type CarouselListing } from "@/components/home/listings-carousel";
import { Reveal } from "@/components/home/reveal";
import { isOverAsking } from "@/components/listings/status-badge";
import { priceLine } from "@/components/listings/listing-card";

/** Direction C, "Light & Airy": serif headline, circular portrait and a stats column. */
export async function Hero() {
  const google = await getGoogleReviews();
  const stats = heroStats.map((s) =>
    s.label === "Google rating" && google ? { ...s, value: formatRating(google.rating) } : s,
  );
  return (
    <section className="overflow-hidden bg-mist-100">
      <div className="container-site grid items-center gap-10 pb-4 pt-10 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)_180px] lg:gap-12">
        <div className="flex flex-col gap-6">
          <p className="eyebrow text-aqua-700">
            {site.agent.name} · Realtor®
          </p>
          <h1 className="font-display text-[clamp(3.25rem,6.6vw,5.25rem)] font-semibold leading-[0.96] tracking-[-0.01em]">
            Your next move, made simple<span className="text-aqua-400">.</span>
          </h1>
          <p className="max-w-[460px] text-lg leading-relaxed text-body">{site.agent.intro}</p>
          <Link
            href="/our-listings"
            className="group inline-flex min-h-12 items-center gap-4 self-start font-extrabold text-aqua-700 hover:text-navy-900"
          >
            Explore listings
            <svg
              width="64"
              height="20"
              viewBox="0 0 64 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              <path d="M0 10h60M54 4l6 6-6 6" />
            </svg>
          </Link>
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

/**
 * Under the hero: the listings search panel (tabs on top, then location, type, price, beds and Search),
 * resting on the navy row with call/text, office and the home evaluation call to action.
 * Desktop: one row each. iPad: search segments in rows of three. Phone: everything stacked.
 */
export async function ContactStrip() {
  const { office, agent } = site;
  const all = await getListings();
  return (
    // Above the next section so the search results can drop down over it; space below before Results.
    <section className="relative z-20 bg-mist-100 pb-16 pt-10 md:pb-24 md:pt-14">
      <div className="container-site">
        <SearchPanel
          listings={searchableListings(all)}
          types={typeOptions(all)}
          cities={site.serviceAreas}
          locations={locationOptions(all, site.serviceAreas)}
          firstName={agent.firstName}
        />
        <div className="grid bg-navy-900 text-on-dark md:grid-cols-3">
          <a href={agent.phoneHref} className="flex flex-col justify-center gap-1.5 border-b border-navy-600 px-7 py-6 hover:bg-navy-800 md:border-b-0 md:border-r">
            <span className="eyebrow text-xs text-on-dark-subtle">Call or text</span>
            <span className="text-xl font-extrabold">{agent.phone}</span>
          </a>
          <div className="flex flex-col justify-center gap-1.5 border-b border-navy-600 px-7 py-6 md:border-b-0 md:border-r">
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

const bedLabel = (b: string) => `${b} bedroom${b.trim() === "1" ? "" : "s"}`;
const bathLabel = (b: number) => `${b} bathroom${b === 1 ? "" : "s"}`;

/**
 * Listings for the "Latest listings" carousel: every listing with a photo, newest first,
 * topped up with the sample sales until there are at least three.
 */
async function carouselListings(): Promise<{ items: CarouselListing[]; forSale: number; sold: number }> {
  const all = await getListings();
  const items: CarouselListing[] = all
    // Off-market homes aren't shown publicly (same as the listings page).
    .filter((l) => l.photos.length > 0 && l.status !== "off-market")
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((l) => {
      const over = isOverAsking(l);
      type Fact = { label: string; value: string };
      const stats = [
        l.bedrooms && { label: "Bedrooms", value: l.bedrooms },
        l.bathrooms != null && { label: "Bathrooms", value: String(l.bathrooms) },
        l.sizeRange && { label: "Sq ft", value: l.sizeRange },
      ].filter((f): f is Fact => Boolean(f));
      const facts = [
        l.propertyType && { label: "Property type", value: l.propertyType },
        { label: "City", value: l.city },
        { label: "MLS®", value: l.mlsNumber },
      ].filter((f): f is Fact => Boolean(f));
      return {
        key: l.mlsNumber,
        href: `/listings/${l.slug}`,
        photos: l.photos,
        title: l.street ?? l.city,
        place: [l.city, l.propertyType].filter(Boolean).join(" · "),
        status: over ? (l.status === "leased" ? "Leased over asking" : "Sold over asking") : statusLabel[l.status],
        over,
        price: priceLine(l),
        points: [
          l.bedrooms && bedLabel(l.bedrooms),
          l.bathrooms != null && bathLabel(l.bathrooms),
          l.propertyType,
          l.sizeRange && `${l.sizeRange} sq ft`,
        ].filter((p): p is string => Boolean(p)),
        stats,
        facts,
        description: l.description,
      };
    });
  const samples: CarouselListing[] = recentSales.map((s) => {
    const place = s.city.startsWith("[") ? "Durham & East GTA" : s.city;
    const status = s.status === "sold-over-asking" ? "Sold over asking" : "Leased over asking";
    return {
      key: s.address,
      href: null,
      photos: [s.image],
      title: s.address,
      place,
      status,
      over: true,
      price: null,
      points: [status, place],
      stats: [],
      facts: [],
      description: null,
    };
  });
  return {
    items: items.length >= 3 ? items : [...items, ...samples].slice(0, Math.max(3, items.length)),
    forSale: all.filter((l) => l.status === "active" || l.status === "pending").length,
    sold: all.filter((l) => isPastDeal(l.status)).length,
  };
}

/** "PK's latest listings": every listing in an animated carousel; hover for key points, expand for details. */
export async function LatestListings() {
  const { items, forSale, sold } = await carouselListings();
  return (
    <section className="relative overflow-hidden bg-mist-100 py-20 md:py-26">
      <Reveal className="container-site flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col">
          <p className="eyebrow text-aqua-700">Listings</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,3.75rem)] font-semibold leading-[1.02]">
            {site.agent.firstName}’s latest listings<span className="text-aqua-400">.</span>
          </h2>
          <p className="mt-5 max-w-[520px] text-base leading-relaxed text-body">
            Homes {site.agent.firstName} is selling now and recent sales across Durham and the East GTA. Hover over a
            home for the key points, or open it for the full details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm md:justify-end md:text-right">
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
      </Reveal>
      <div className="mt-8">
        <ListingsCarousel listings={items} />
      </div>
    </section>
  );
}
