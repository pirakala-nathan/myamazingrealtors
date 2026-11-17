import Link from "next/link";
import { site } from "@/lib/site";

/** Floating Call / Text / Book bar shown on phones only. */
export function MobileActionBar() {
  return (
    <nav
      aria-label="Quick contact"
      className="fixed inset-x-3 bottom-4 z-40 grid grid-cols-3 gap-1.5 rounded-full bg-noir-900 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,.3)] md:hidden"
    >
      <a href={site.agent.phoneHref} className="flex min-h-12 items-center justify-center text-sm font-bold text-on-dark">
        Call
      </a>
      <a href={site.agent.smsHref} className="flex min-h-12 items-center justify-center text-sm font-bold text-on-dark">
        Text
      </a>
      <Link
        href="/contact"
        className="flex min-h-12 items-center justify-center rounded-full bg-champagne-400 text-sm font-extrabold text-noir-900"
      >
        Book {site.agent.firstName}
      </Link>
    </nav>
  );
}
