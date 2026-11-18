import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="bg-navy-950 text-on-dark-muted">
      <div className="container-site flex flex-col gap-9 pb-7 pt-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2 lg:col-span-2">
            <Logo reverse showBrokerage={false} />
            <address className="text-sm not-italic leading-7">
              {site.agent.name}, {site.agent.title}
              <br />
              {site.brokerage.name}, Brokerage
              <br />
              {site.office.street}, {site.office.city}, {site.office.region} {site.office.postalCode}
              <br />
              Office <a href={site.office.phoneHref} className="hover:text-aqua-300">{site.office.phone}</a>
            </address>
          </div>
          <div className="flex flex-col gap-2 text-[15px]">
            <span className="eyebrow text-xs text-aqua-400">Explore</span>
            <Link href="/about" className="hover:text-aqua-300">About PK</Link>
            <Link href="/buy" className="hover:text-aqua-300">Buying</Link>
            <Link href="/sell" className="hover:text-aqua-300">Selling</Link>
            <Link href="/our-listings" className="hover:text-aqua-300">PK’s listings</Link>
            <Link href="/home-evaluation" className="hover:text-aqua-300">Home valuation</Link>
            <Link href="/contact" className="hover:text-aqua-300">Contact</Link>
          </div>
          <div className="flex flex-col gap-2 text-[15px]">
            <span className="eyebrow text-xs text-aqua-400">Follow</span>
            <a href={site.social.instagram} className="hover:text-aqua-300">Instagram</a>
            <a href={site.social.facebook} className="hover:text-aqua-300">Facebook</a>
          </div>
        </div>
        <p className="border-t border-navy-600 pt-5 text-[12.5px] leading-relaxed text-on-dark-subtle">
          © {year} {site.name} · {site.brokerage.legalLine} Not intended to solicit buyers or sellers currently under
          contract. The trademarks MLS®, Multiple Listing Service® and REALTOR® are owned by CREA. Listing information
          is deemed reliable but not guaranteed. · <Link href="/privacy" className="underline">Privacy</Link> ·{" "}
          <Link href="/terms" className="underline">Terms</Link> ·{" "}
          <Link href="/accessibility" className="underline">Accessibility</Link>
        </p>
      </div>
    </footer>
  );
}
