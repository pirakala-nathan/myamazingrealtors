import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms for using the ${site.name} website.`,
  alternates: { canonical: "/terms" },
};

// Plain-language terms; PK and the brokerage should review before launch.
const UPDATED = "November 18, 2026";

export default function TermsPage() {
  const { agent, brokerage } = site;
  return (
    <>
      <PageHeader eyebrow="Terms" title="Terms of use">
        <p>Last updated {UPDATED}</p>
      </PageHeader>
      <section className="container-site pb-20 md:pb-26">
        <Prose>
          <p>
            This website is operated by {agent.name}, {agent.title} with {brokerage.name}, Brokerage. By using it, you agree
            to these terms.
          </p>

          <h2>Information on this site</h2>
          <p>
            Listing details, prices, market information and home evaluations are provided for general information. They are
            believed to be reliable but are not guaranteed, may change without notice, and should be independently
            verified. A home evaluation from this site is an opinion of market value, not a formal appraisal.
          </p>
          <p>
            Nothing on this site is legal, tax, financial or mortgage advice. Please speak with the appropriate professional
            before making decisions.
          </p>

          <h2>Listings and MLS® data</h2>
          <p>
            Listings shown are those of {agent.firstName} and {brokerage.name}, Brokerage, unless stated otherwise. Each
            listing page credits the listing brokerage. The trademarks MLS®, Multiple Listing Service® and the associated
            logos are owned by The Canadian Real Estate Association (CREA) and identify the quality of services provided by
            real estate professionals who are members of CREA. The trademarks REALTOR®, REALTORS® and the REALTOR® logo are
            controlled by CREA and identify real estate professionals who are members of CREA.
          </p>

          <h2>No agency relationship</h2>
          <p>
            Using this site or sending a form does not create a brokerage or agency relationship. That only happens through a
            written agreement. This site is not intended to solicit buyers or sellers currently under contract with another
            brokerage.
          </p>

          <h2>Reviews</h2>
          <p>
            Client reviews shown on this site come from Google Maps and are the reviewers’ own opinions. They are shown as
            Google provides them.
          </p>

          <h2>Content and use</h2>
          <p>
            The design, text, logo and photos on this site belong to {site.name} or are used with permission. Please don’t
            copy or reuse them without written permission. Don’t use the site in a way that could damage it or interfere
            with others using it, including automated scraping.
          </p>

          <h2>Other websites</h2>
          <p>Links to other websites are for convenience. We’re not responsible for their content or privacy practices.</p>

          <h2>Liability</h2>
          <p>
            To the extent the law allows, {agent.name} and {brokerage.name}, Brokerage are not liable for any loss arising
            from use of this site or reliance on its information.
          </p>

          <h2>Privacy</h2>
          <p>
            How we handle your personal information is explained in our <Link href="/privacy">privacy policy</Link>.
          </p>

          <h2>Governing law and changes</h2>
          <p>
            These terms are governed by the laws of Ontario and Canada. We may update them; the date above shows the latest
            version. Questions: <a href={`mailto:${agent.email}`}>{agent.email}</a>.
          </p>
        </Prose>
      </section>
    </>
  );
}
