import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { insights, services, testimonials } from "@/lib/content/home";
import { ButtonLink } from "@/components/ui/button-link";

export function Services() {
  return (
    <section className="container-site pb-20 pt-6 md:pb-26">
      <ul className="grid gap-px border border-cloud-300 bg-cloud-300 md:grid-cols-3">
        {services.map((s) => (
          <li key={s.eyebrow} className="bg-mist-50">
            <Link href={s.href} className="group flex h-full flex-col gap-3.5 px-8 py-10">
              <span className="eyebrow text-xs text-aqua-700">{s.eyebrow}</span>
              <span className="font-display text-[34px] font-semibold leading-tight">{s.title}</span>
              <span className="text-[15px] leading-relaxed text-body">{s.body}</span>
              <span className="mt-auto font-bold group-hover:text-aqua-700">{s.cta} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WatchSection() {
  return (
    <section className="bg-navy-900 text-on-dark">
      <div className="container-site flex flex-col gap-12 py-20 md:py-24 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-4.5 lg:flex-[1_1_360px]">
          <p className="eyebrow text-aqua-400">Watch {site.agent.firstName}</p>
          <h2 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] font-semibold leading-none">
            Home tours &amp; market updates.
          </h2>
          <p className="text-[17px] leading-relaxed text-on-dark-muted">
            Walk through new listings, neighbourhoods and what the numbers mean for you, in under five minutes.
          </p>
          {site.social.youtube ? (
            <ButtonLink href={site.social.youtube} variant="accent" className="self-start">
              Subscribe on YouTube
            </ButtonLink>
          ) : (
            <ButtonLink href={site.social.instagram} variant="accent" className="self-start">
              Follow on Instagram
            </ButtonLink>
          )}
        </div>
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

export function Testimonials() {
  return (
    <section className="container-site py-20 md:py-26">
      <h2 className="mb-10 font-display text-[clamp(2.5rem,4.6vw,4rem)] font-semibold leading-none">What clients say.</h2>
      <ul className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <li key={i}>
            <figure className="flex h-full flex-col gap-4.5 border border-cloud-300 bg-mist-50 p-8">
              <span className="tracking-[3px] text-aqua-500" role="img" aria-label="5 out of 5 stars">
                ★★★★★
              </span>
              <blockquote className="font-display text-2xl italic leading-snug">{t.quote}</blockquote>
              <figcaption className="mt-auto text-sm font-bold">
                {t.name} <span className="font-medium text-muted">· {t.context}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
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
