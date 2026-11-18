import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { heroStats, recentSales } from "@/lib/content/home";
import { formatRating, getGoogleReviews } from "@/lib/google-reviews";
import { getListings } from "@/lib/listings/store";
import { listingTitle, statusLabel } from "@/lib/listings/types";
import { ListingSpotlight, type SpotlightListing } from "@/components/home/listing-spotlight";
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
  return {
    items: items.length >= 3 ? items : [...items, ...samples].slice(0, Math.max(3, items.length)),
    forSale: all.filter((l) => l.status === "active" || l.status === "pending").length,
    sold: all.filter((l) => l.status === "sold" || l.status === "leased").length,
  };
}

/** "Search PK's listings": search box, city shortcuts and the animated listing spotlight. */
export async function SearchSection() {
  const { items, forSale, sold } = await spotlightListings();
  return (
    <section className="relative overflow-hidden bg-mist-100 py-20 md:py-26">
      {/* A large, faint logo-cyan block behind the photos gives the section depth. */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[38%] bg-aqua-100 lg:block" />
      <Reveal className="container-site relative grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="flex flex-col">
          <p className="eyebrow text-aqua-700">Listings</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,3.75rem)] font-semibold leading-[1.02]">
            Search {site.agent.firstName}’s listings<span className="text-aqua-400">.</span>
          </h2>
          <p className="mt-5 max-w-[460px] text-base leading-relaxed text-body">
            Homes {site.agent.firstName} is selling now and recent sales across Durham and the East GTA. Looking for
            something else? {site.agent.firstName} can send you new listings that match your search.
          </p>

          <form action="/our-listings" method="get" role="search" className="group mt-8 flex max-w-[500px] flex-col gap-3 sm:flex-row sm:gap-0">
            <label htmlFor="home-search" className="sr-only">
              Search {site.agent.firstName}’s listings by city, street or MLS® number
            </label>
            <span className="relative flex min-w-0 flex-1">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-aqua-700"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder="City, street or MLS®#"
                className="min-h-14 w-full min-w-0 rounded-none border border-cloud-400 bg-white pl-12 pr-4 text-base text-ink shadow-[0_10px_30px_-18px_rgba(10,29,40,0.45)] transition-[border-color,box-shadow] placeholder:text-muted focus:border-aqua-500 focus:shadow-[0_14px_36px_-16px_rgba(0,178,219,0.55)] focus:outline-none"
              />
            </span>
            <button
              type="submit"
              className="min-h-14 rounded-none bg-navy-900 px-8 font-extrabold text-on-dark transition-colors hover:bg-aqua-400 hover:text-navy-900"
            >
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Browse by city">
            {site.serviceAreas.map((city) => (
              <Link
                key={city}
                href={`/our-listings?q=${encodeURIComponent(city)}`}
                className="border border-cloud-400 bg-white px-3.5 py-2 text-sm font-semibold text-body transition-all hover:-translate-y-0.5 hover:border-navy-900 hover:text-ink"
              >
                {city}
              </Link>
            ))}
          </div>

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
