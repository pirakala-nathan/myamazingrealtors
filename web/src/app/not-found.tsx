import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <section className="container-site flex flex-col items-start gap-6 py-28">
      <p className="eyebrow text-aqua-700">Coming soon</p>
      <h1 className="font-display text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-none">This page is on its way.</h1>
      <p className="max-w-xl text-lg leading-relaxed text-body">
        We’re building out the new site. In the meantime, PK is one call away.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="tel:+16478922124" variant="secondary">
          Call 647.892.2124
        </ButtonLink>
      </div>
    </section>
  );
}
