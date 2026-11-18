import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { heroStats, recentSales } from "@/lib/content/home";
import { formatRating, getGoogleReviews } from "@/lib/google-reviews";
import { getListings } from "@/lib/listings/store";
import { listingTitle, statusLabel } from "@/lib/listings/types";
import { PhotoRotator, type RotatorPhoto } from "@/components/home/photo-rotator";

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

/** MLS® search beside a small grid of recent listing photos. */
/**
 * Cover photos for the search section: newest listings PK has added first (any status),
 * topped up with the sample sale photos until there are at least three.
 */
async function searchPhotos(): Promise<RotatorPhoto[]> {
  const listings = (await getListings())
    .filter((l) => l.photos.length > 0)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, 12)
    .map((l) => ({ src: l.photos[0], alt: `${listingTitle(l)}, ${statusLabel[l.status].toLowerCase()}`, href: `/listings/${l.slug}` }));
  const samples = recentSales.map((s) => ({ src: s.image, alt: s.imageAlt, href: null }));
  return listings.length >= 3 ? listings : [...listings, ...samples].slice(0, Math.max(3, listings.length));
}

export async function SearchSection() {
  const photos = await searchPhotos();
  return (
    <section className="container-site grid items-center gap-12 pb-20 pt-6 md:pb-26 lg:grid-cols-2 lg:gap-14">
      <div className="flex flex-col">
        <h2 className="font-display text-[clamp(2.5rem,4.6vw,3.5rem)] font-semibold leading-[1.02]">
          Search every MLS® listing
        </h2>
        <span aria-hidden="true" className="my-5 block h-[3px] w-14 bg-aqua-400" />
        <p className="max-w-[440px] text-base leading-relaxed text-body">
          Homes for sale across Durham and the East GTA. Save a search and {site.agent.firstName} will send you new
          matches.
        </p>
        <form action="/search" method="get" role="search" className="mt-7 flex max-w-[480px] flex-col gap-3 sm:flex-row sm:gap-0">
          <label htmlFor="home-search" className="sr-only">
            Search homes by city, neighbourhood, address or MLS® number
          </label>
          <input
            id="home-search"
            name="q"
            type="search"
            placeholder="City, neighbourhood or MLS®#"
            className="min-h-13 min-w-0 flex-1 rounded-none border border-cloud-400 bg-white px-5 text-base text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            className="min-h-13 rounded-none bg-navy-900 px-7 font-extrabold text-on-dark hover:bg-navy-700 hover:text-aqua-300"
          >
            Search
          </button>
        </form>
      </div>
      <PhotoRotator photos={photos} />
    </section>
  );
}
