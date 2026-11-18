import Link from "next/link";
import { mainNav } from "@/lib/site";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { ButtonLink } from "@/components/ui/button-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-cloud-300 bg-mist-100/95 backdrop-blur">
      <div className="container-site flex items-center justify-between gap-6 py-3.5">
        <Logo showBrokerage={false} />
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex gap-7 text-[15px] font-semibold">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="whitespace-nowrap py-2.5 hover:text-aqua-700">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <ButtonLink href="/contact" className="whitespace-nowrap">
              Book a call
            </ButtonLink>
          </span>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
