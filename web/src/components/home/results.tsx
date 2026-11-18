import Image from "next/image";
import Link from "next/link";
import { getListings } from "@/lib/listings/store";
import { listingTitle, statusLabel } from "@/lib/listings/types";
import { factsLine, isRemote } from "@/components/listings/listing-card";
import { OverAskingBadge, isOverAsking } from "@/components/listings/status-badge";
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

type SaleCard = {
  key: string;
  href: string | null;
  title: string;
  image: string;
  imageAlt: string;
  /** Plain status text, or "over" for the special over-asking badge. */
  badge: string;
  over: "sold" | "leased" | null;
  line: string;
};

/** Sold and leased listings PK has added on the admin page; the sample sales in lib/content/home.ts until there are some. */
async function saleCards(): Promise<SaleCard[]> {
  const sold = (await getListings())
    .filter((l) => (l.status === "sold" || l.status === "leased") && l.photos.length > 0)
    .slice(0, 4);
  if (sold.length > 0) {
    return sold.map((l) => ({
      key: l.mlsNumber,
      href: `/listings/${l.slug}`,
      title: l.street ?? l.city,
      image: l.photos[0],
      imageAlt: `Front of ${listingTitle(l)}`,
      badge: statusLabel[l.status],
      over: isOverAsking(l) ? (l.status === "leased" ? "leased" : "sold") : null,
      line: [l.city, factsLine(l)].filter(Boolean).join(" · "),
    }));
  }
  return recentSales.map((sale) => ({
    key: sale.address,
    href: null,
    title: sale.address,
    image: sale.image,
    imageAlt: sale.imageAlt,
    badge: "Sold",
    over: sale.status === "sold-over-asking" ? "sold" : "leased",
    line: `List price ${formatPrice(sale.listPrice)} · ${sale.city}`,
  }));
}

export async function RecentSales() {
  const cards = await saleCards();
  return (
    <section className="container-site pb-14 pt-20 md:pt-26">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] font-semibold leading-none">Recently sold.</h2>
        <ButtonLink href="/our-listings" variant="secondary" className="self-start">
          All of PK’s listings
        </ButtonLink>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const body = (
            <article className="group flex flex-col gap-3">
              <div className="relative aspect-[4/5] overflow-hidden bg-cloud-300">
                <Image
                  src={c.image}
                  alt={c.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized={isRemote(c.image)}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                {c.over ? (
                  <OverAskingBadge leased={c.over === "leased"} className="absolute left-3.5 top-3.5" />
                ) : (
                  <span className="absolute left-3.5 top-3.5 bg-navy-900 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-aqua-400">
                    {c.badge}
                  </span>
                )}
              </div>
              <h3 className="font-display text-[26px] font-bold group-hover:text-aqua-700">{c.title}</h3>
              <p className="text-sm text-muted">{c.line}</p>
            </article>
          );
          return <li key={c.key}>{c.href ? <Link href={c.href}>{body}</Link> : body}</li>;
        })}
      </ul>
    </section>
  );
}
