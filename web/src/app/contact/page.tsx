import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHeader } from "@/components/layout/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact PK",
  description: `Call, text or message ${site.agent.name}, Realtor® with ${site.brokerage.name}, about buying or selling in Pickering, Ajax, Whitby, Oshawa, Scarborough and Markham.`,
  alternates: { canonical: "/contact" },
};

function ContactMethod({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-noir-600 py-5">
      <span className="eyebrow text-xs text-champagne-400">{label}</span>
      <div className="text-lg text-on-dark">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Let’s talk<span className="text-champagne-700">.</span>
          </>
        }
      >
        <p>
          Thinking about buying, selling or just want a straight answer about the market? Send a message and{" "}
          {site.agent.firstName} will reply personally.
        </p>
      </PageHeader>

      <section className="container-site grid gap-10 pb-20 md:pb-26 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div className="border border-stone-300 bg-ivory-50 p-6 sm:p-8 md:p-10">
          <ContactForm />
        </div>

        <aside className="flex flex-col bg-noir-900 px-6 pb-4 pt-8 text-on-dark-muted sm:px-8">
          <h2 className="mb-4 font-display text-3xl font-semibold text-on-dark">Prefer to call?</h2>
          <ContactMethod label="Call or text">
            <a href={site.agent.phoneHref} className="font-bold hover:text-champagne-300">
              {site.agent.phone}
            </a>
          </ContactMethod>
          <ContactMethod label="Email">
            <a href={`mailto:${site.agent.email}`} className="break-all hover:text-champagne-300">
              {site.agent.email}
            </a>
          </ContactMethod>
          <ContactMethod label="Office">
            <address className="text-base not-italic leading-relaxed text-on-dark-muted">
              {site.brokerage.name}, Brokerage
              <br />
              {site.office.street}
              <br />
              {site.office.city}, {site.office.region} {site.office.postalCode}
              <br />
              <a href={site.office.phoneHref} className="hover:text-champagne-300">
                {site.office.phone}
              </a>
            </address>
          </ContactMethod>
        </aside>
      </section>
    </>
  );
}
