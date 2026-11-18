import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { ContactCta } from "@/components/home/sections";
import { stats } from "@/lib/content/home";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About PK",
  description: `${site.agent.name}, ${site.agent.title} with ${site.brokerage.name}, Brokerage. 12+ years in real estate, hands-on building and development experience, and service in English and Tamil across Durham and the East GTA.`,
  alternates: { canonical: "/about" },
};

const strengths = [
  {
    title: "A negotiator in your corner",
    body: "Over 150 homes bought and sold. PK knows how to read an offer, when to hold firm and when a deal is worth making, and keeps you informed at every step.",
  },
  {
    title: "A builder’s eye",
    body: "Years of building and developing homes mean PK looks past the staging: construction quality, layout, what’s worth updating and what an improvement really costs.",
  },
  {
    title: "Local, in two languages",
    body: "Pickering, Ajax, Whitby, Oshawa, Scarborough and Markham, with service in English and Tamil, so nothing gets lost in translation.",
  },
];

export default function AboutPage() {
  const { agent } = site;
  return (
    <>
      <section className="bg-mist-100">
        <div className="container-site grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          <div className="flex flex-col gap-6">
            <p className="eyebrow text-aqua-700">About {agent.firstName}</p>
            <h1 className="font-display text-[clamp(3rem,6.4vw,5.25rem)] font-semibold leading-[0.95]">
              Real estate advice, built from the ground up<span className="text-aqua-400">.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-body">{agent.intro}</p>
            <p className="text-sm font-semibold text-muted">
              {agent.name} · {agent.title} · {site.brokerage.name}, Brokerage · Speaks {agent.languages.join(" and ")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact">Talk to {agent.firstName}</ButtonLink>
              <ButtonLink href="/home-evaluation" variant="secondary">
                What’s my home worth?
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden">
            <Image
              src={agent.photo}
              alt={`Portrait of ${agent.name}`}
              fill
              preload
              sizes="(min-width: 1024px) 420px, 90vw"
              className="object-cover object-[center_15%]"
            />
          </div>
        </div>
      </section>

      <section className="bg-navy-900 text-on-dark">
        <dl className="container-site grid grid-cols-2 gap-px py-12 lg:grid-cols-4">
          {[
            ...stats.filter((s) => s.label !== "Google rating").map((s) => ({ value: s.value, label: s.label })),
            { value: "2", label: "Languages: English and Tamil" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-2 p-4 sm:p-6">
              <dt className="text-sm font-bold sm:text-base">{s.label}</dt>
              <dd className="order-first font-display text-4xl font-bold leading-none text-aqua-400 sm:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-site py-20 md:py-26">
        <h2 className="mb-10 font-display text-[clamp(2.5rem,4.6vw,3.5rem)] font-semibold leading-[1.02]">
          Why clients work with {agent.firstName}
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {strengths.map((s) => (
            <li key={s.title} className="flex flex-col gap-3 border border-cloud-300 bg-mist-50 p-8">
              <span aria-hidden="true" className="block h-[3px] w-10 bg-aqua-400" />
              <h3 className="text-[21px] font-extrabold">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-body">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-mist-100">
        <div className="container-site grid gap-10 py-20 md:py-26 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-5">
            <p className="eyebrow text-aqua-700">Beyond real estate</p>
            <h2 className="font-display text-[clamp(2.5rem,4.6vw,3.5rem)] font-semibold leading-[1.02]">
              Arbour &amp; Oak, and an eye for craftsmanship
            </h2>
          </div>
          <div className="flex flex-col gap-4 text-[17px] leading-relaxed text-body">
            <p>
              {agent.firstName} also owns <strong className="text-ink">Arbour &amp; Oak</strong>, a millwork company. Working
              with cabinetry, trim and custom finishes every day sharpens the eye for detail that buyers and sellers
              benefit from.
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-6">
              <li>
                <strong className="text-ink">Buying:</strong> a clear read on the quality of a home’s finishes and
                woodwork, and what it would realistically take to update a kitchen, closet or staircase.
              </li>
              <li>
                <strong className="text-ink">Selling:</strong> practical advice on which touch-ups are worth doing before
                you list, and which aren’t.
              </li>
            </ul>
            <p className="border-l-4 border-aqua-500 bg-mist-50 px-4 py-3 text-sm">
              <strong className="text-ink">Disclosure:</strong> {agent.name} has an ownership interest in Arbour &amp;
              Oak. Using Arbour &amp; Oak is never a condition of working with {agent.firstName}. If {agent.firstName}{" "}
              ever suggests its services, you’ll be told about this interest in writing first, and you’re free to use
              any company you choose.
            </p>
          </div>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
