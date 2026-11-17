import Image from "next/image";
import { site } from "@/lib/site";
import { heroBadge } from "@/lib/content/home";
import { ButtonLink } from "@/components/ui/button-link";

export function Hero() {
  return (
    <section className="overflow-hidden bg-ivory-100">
      <div className="container-site flex flex-col-reverse md:flex-row md:items-stretch">
        <div className="flex flex-1 flex-col justify-center gap-6 py-10 md:py-22 md:pr-10">
          <p className="eyebrow text-champagne-700">Realtor® · Durham Region &amp; East GTA</p>
          <h1 className="font-display text-[clamp(3rem,7.4vw,7rem)] font-semibold leading-[0.92] tracking-[-0.01em]">
            {site.agent.firstName}
            <br />
            <span className="break-words">Sithamparanathan</span>
            <span className="text-champagne-400">.</span>
          </h1>
          <p className="max-w-[540px] text-lg leading-relaxed text-body">{site.agent.intro}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact">Work with {site.agent.firstName}</ButtonLink>
            <ButtonLink href="/home-evaluation" variant="secondary">
              What’s my home worth?
            </ButtonLink>
          </div>
        </div>
        <div className="relative -mx-4 h-[380px] md:mx-0 md:h-auto md:min-h-[560px] md:flex-[0_1_44%]">
          <Image
            src={site.agent.photo}
            alt={`Portrait of ${site.agent.name}`}
            fill
            preload
            sizes="(min-width: 768px) 44vw, 100vw"
            className="object-cover object-[center_18%]"
          />
          <div className="absolute bottom-6 left-6 hidden flex-col gap-0.5 bg-noir-900 px-5 py-4 text-on-dark md:flex">
            <span className="font-display text-3xl font-bold text-champagne-400">{heroBadge.value}</span>
            <span className="text-[13px] font-semibold">{heroBadge.label}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SearchStrip() {
  return (
    <section className="bg-noir-900">
      <form action="/search" method="get" role="search" className="container-site flex flex-col gap-3 py-5 md:flex-row md:items-center">
        <label htmlFor="hero-search" className="font-display text-2xl font-semibold text-on-dark md:mr-3">
          Search every MLS® listing
        </label>
        <input
          id="hero-search"
          name="q"
          type="search"
          placeholder="City, neighbourhood, address or MLS®#"
          className="min-h-13 flex-1 rounded-full border border-noir-500 bg-noir-700 px-5 text-base text-white placeholder:text-on-dark-subtle"
        />
        <button
          type="submit"
          className="min-h-13 rounded-full bg-champagne-400 px-7 font-extrabold text-noir-900 hover:bg-champagne-300"
        >
          Search
        </button>
      </form>
    </section>
  );
}
