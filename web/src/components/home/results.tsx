import Image from "next/image";
import { recentSales, stats as baseStats, formatPrice } from "@/lib/content/home";
import { formatRating, getGoogleReviews } from "@/lib/google-reviews";
import { ButtonLink } from "@/components/ui/button-link";

export async function ResultsBand() {
  const google = await getGoogleReviews();
  const stats = baseStats.map((s) =>
    s.label === "Google rating" && google
      ? { ...s, value: formatRating(google.rating), detail: `From ${google.count} Google reviews` }
      : s,
  );
  return (
    <section className="bg-navy-800 text-on-dark">
      <div className="container-site flex flex-col gap-11 py-20 md:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 className="font-display text-[clamp(2.75rem,5.4vw,4.75rem)] font-semibold leading-[0.95]">
            Results,
            <br />
            <span className="text-aqua-400">not promises.</span>
          </h2>
          <p className="max-w-[460px] text-[17px] leading-relaxed text-on-dark-muted">
            Every listing gets a pricing strategy, professional photography and video, and a negotiator who treats your
            home like their own.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2 border border-navy-600 bg-navy-900 p-4 sm:p-7 lg:min-h-45">
              <dt className="text-sm font-bold sm:text-[17px]">{s.label}</dt>
              <dd className="order-first font-display text-4xl font-bold leading-none text-aqua-400 sm:text-[54px]">
                {s.value}
              </dd>
              <dd className="hidden text-sm text-on-dark-subtle sm:block">{s.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function RecentSales() {
  return (
    <section className="container-site pb-14 pt-20 md:pt-26">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] font-semibold leading-none">Sold over asking.</h2>
        <ButtonLink href="/our-listings" variant="secondary" className="self-start">
          All of PK’s listings
        </ButtonLink>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {recentSales.map((sale) => (
          <li key={sale.address}>
            <article className="flex flex-col gap-3">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={sale.image}
                  alt={sale.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
                <span className="absolute left-3.5 top-3.5 bg-navy-900 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-aqua-400">
                  {sale.status === "sold-over-asking" ? "Sold over asking" : "Leased over asking"}
                </span>
              </div>
              <h3 className="font-display text-[26px] font-bold">{sale.address}</h3>
              <p className="text-sm text-muted">
                List price {formatPrice(sale.listPrice)} · {sale.city}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
