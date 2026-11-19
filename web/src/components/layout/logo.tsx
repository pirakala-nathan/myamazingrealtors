import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

// Official logo, converted to SVG from MARs_LogoGlobalColors.ai (see public/brand/).
// Horizontal lockup is 315.5 × 50.4 units.
const RATIO = 315.5 / 50.4;

export function Logo({ reverse = false, showBrokerage = true }: { reverse?: boolean; showBrokerage?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 flex-col items-start gap-1" aria-label={`${site.name} home`}>
      {/* On light backgrounds the navy logo, swapped for the white one on the dark theme; reverse is always white. */}
      <Image
        src={reverse ? "/brand/logo-horizontal-reverse.svg" : "/brand/logo-horizontal.svg"}
        alt={site.name}
        width={Math.round(40 * RATIO)}
        height={40}
        preload={!reverse}
        unoptimized
        className={`h-8 w-auto sm:h-10 ${reverse ? "" : "theme-light-only"}`}
      />
      {!reverse && (
        <Image
          src="/brand/logo-horizontal-reverse.svg"
          alt={site.name}
          width={Math.round(40 * RATIO)}
          height={40}
          unoptimized
          className="theme-dark-only h-8 w-auto sm:h-10"
        />
      )}
      {showBrokerage && (
        <span className={`truncate text-[10px] font-semibold sm:text-[11px] ${reverse ? "text-on-dark-subtle" : "text-muted"}`}>
          {site.brokerage.name}, Brokerage
        </span>
      )}
    </Link>
  );
}
