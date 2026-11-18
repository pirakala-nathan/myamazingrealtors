import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { insights, services, testimonials } from "@/lib/content/home";
import { getGoogleReviews } from "@/lib/google-reviews";
import { ReviewCarousel } from "@/components/home/review-carousel";
import { getReels } from "@/lib/reels";
import { ReelCarousel } from "@/components/home/reel-carousel";
import { ButtonLink } from "@/components/ui/button-link";

const serviceIcons = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-7 9 7v9H3z" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  chart: <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" />,
};

export function Services() {
  return (
    <section className="container-site pb-14 pt-20 md:pt-26">
      <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <h2 className="font-display text-[clamp(2.5rem,4.6vw,3.5rem)] font-semibold leading-[1.02]">
          How {site.agent.firstName} can help
        </h2>
        <p className="max-w-[420px] text-base leading-relaxed text-body">
          Buying, selling or just curious what your home is worth. Start where you are.
        </p>
      </div>
      <ul className="grid gap-5 md:grid-cols-3">
        {services.map((s) => {
          const highlight = "highlight" in s && s.highlight;
          return (
            <li key={s.title}>
              <Link
                href={s.href}
                className={`group flex h-full flex-col gap-3 border px-7 py-8 transition-colors ${
                  highlight
                    ? "border-aqua-400 bg-aqua-400 text-navy-900 hover:bg-aqua-300"
                    : "border-cloud-300 bg-mist-50 hover:border-navy-900"
                }`}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className={highlight ? "text-navy-900" : "text-aqua-700"}
                >
                  {serviceIcons[s.icon]}
                </svg>
                <span className="mt-2 text-[21px] font-extrabold">{s.title}</span>
                <span className={`text-[15px] leading-relaxed ${highlight ? "text-navy-900" : "text-body"}`}>{s.body}</span>
                <span className={`mt-auto pt-2 font-extrabold ${highlight ? "" : "text-aqua-700 group-hover:text-navy-900"}`}>
                  {s.cta} →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function WatchSection() {
  const reels = await getReels();
  const intro = (
    <>
      <p className="eyebrow text-aqua-400">Watch {site.agent.firstName}</p>
      <h2 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] font-semibold leading-none">
        Real estate, in under a minute.
      </h2>
      <p className="text-[17px] leading-relaxed text-on-dark-muted">
        Quick tours of {site.agent.firstName}’s listings, neighbourhood spotlights and straight-talk tips for buyers and
        sellers.
      </p>
    </>
  );

  if (reels.length > 0) {
    return (
      <section id="videos" className="scroll-mt-20 overflow-hidden bg-navy-900 text-on-dark">
        <div className="container-site pt-20 md:pt-24">
          <div className="flex max-w-2xl flex-col gap-4.5">{intro}</div>
        </div>
        <div className="mt-6 pb-20 md:mt-8 md:pb-24">
          <ReelCarousel
            reels={reels.map((r) => ({
              id: r.id,
              video: r.video!,
              videoHd: r.videoHd ?? null,
              poster: r.poster,
              title: r.title,
              instagramUrl: r.instagramUrl,
            }))}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="videos" className="scroll-mt-20 bg-navy-900 text-on-dark">
      <div className="container-site flex flex-col gap-12 py-20 md:py-24 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-4.5 lg:flex-[1_1_360px]">{intro}</div>
        {/* Placeholder poster until a real video is supplied. */}
        <div className="relative aspect-video lg:flex-[1.4_1_520px]">
          <Image
            src="/images/listings/81-butson-crescent-kitchen.jpg"
            alt="Bright open-concept kitchen and dining room from a recent listing"
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover brightness-75"
          />
          <span className="absolute inset-0 m-auto flex size-22 items-center justify-center rounded-full bg-mist-100" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#0a1d28">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="tracking-[3px] text-aqua-500" role="img" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(full)}
      <span className="text-cloud-400">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export async function Testimonials() {
  const google = await getGoogleReviews();
  const reviews = google?.reviews ?? [];

  return (
    <section id="reviews" className="container-site scroll-mt-20 py-20 md:py-26">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <h2 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] font-semibold leading-none">What clients say.</h2>
        {google && (
          <p className="text-sm text-body">
            <strong className="font-display text-2xl font-semibold text-ink">{google.rating.toFixed(1)}</strong>{" "}
            <Stars rating={google.rating} /> from {google.count} reviews on Google Maps
          </p>
        )}
      </div>

      <ReviewCarousel
        reviews={
          reviews.length > 0
            ? reviews.map((r) => ({
                text: r.text,
                rating: r.rating,
                author: r.author,
                authorUri: r.authorUri,
                authorPhoto: r.authorPhoto,
                meta: r.relativeTime,
                reviewUri: r.reviewUri,
              }))
            : testimonials.map((t) => ({ text: t.quote, rating: 5, author: t.name, meta: t.context }))
        }
      />

      {google && (
        <p className="mt-6 flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            {google.source === "business-profile"
              ? "Source: Google Maps. Newest reviews first."
              : "Source: Google Maps. Showing Google’s most relevant reviews, newest first. Reviews aren’t verified by Google."}
          </span>
          {google.mapsUri && (
            <a href={google.mapsUri} target="_blank" rel="noopener noreferrer" className="font-bold text-aqua-700 hover:text-navy-900">
              Read all {google.count} reviews on Google Maps →
            </a>
          )}
        </p>
      )}
    </section>
  );
}

export function Insights() {
  return (
    <section className="border-y border-cloud-300 bg-mist-50">
      <div className="container-site flex flex-col gap-12 py-20 md:py-24 lg:flex-row">
        <div className="flex flex-col gap-4 lg:flex-[1_1_320px]">
          <h2 className="font-display text-[clamp(2.5rem,4.6vw,3.75rem)] font-semibold leading-none">Market insights.</h2>
          <p className="leading-relaxed text-body">
            {site.agent.firstName}’s take on prices, rates and neighbourhoods across Durham and the East GTA.
          </p>
          <ButtonLink href="/blog" variant="secondary" className="self-start">
            Read all insights
          </ButtonLink>
        </div>
        <ul className="flex flex-col border-b border-cloud-300 lg:flex-[2_1_560px]">
          {insights.map((post, i) => (
            <li key={i} className="border-t border-cloud-300">
              <Link href={post.href} className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8">
                <span className="min-w-28 text-[13px] font-bold text-aqua-700">{post.date}</span>
                <span className="flex-1 font-display text-[26px] font-semibold leading-tight group-hover:text-aqua-700">
                  {post.title}
                </span>
                <span className="font-bold">Read →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ContactCta() {
  return (
    <section className="bg-navy-900 text-on-dark">
      <div className="container-site flex flex-col gap-10 py-20 md:py-24 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-display text-[clamp(2.75rem,5.4vw,4.75rem)] font-semibold leading-[0.98]">
          Let’s talk about
          <br />
          <span className="text-aqua-400">your next move.</span>
        </h2>
        <div className="flex flex-col gap-3 lg:w-[380px]">
          <ButtonLink href="/contact" variant="accent">
            Book a call with {site.agent.firstName}
          </ButtonLink>
          <a
            href={site.agent.phoneHref}
            className="inline-flex min-h-12 items-center justify-center rounded-none border-[1.5px] border-on-dark px-6 font-bold hover:bg-on-dark hover:text-navy-900"
          >
            Call {site.agent.phone}
          </a>
          <a href={`mailto:${site.agent.email}`} className="py-2 text-center text-on-dark-muted hover:text-aqua-300">
            {site.agent.email}
          </a>
        </div>
      </div>
    </section>
  );
}
