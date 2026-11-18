import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility",
  description: `${site.name} is committed to a website everyone can use.`,
  alternates: { canonical: "/accessibility" },
};

const UPDATED = "November 18, 2026";

export default function AccessibilityPage() {
  const { agent } = site;
  return (
    <>
      <PageHeader eyebrow="Accessibility" title="Accessibility statement">
        <p>Last updated {UPDATED}</p>
      </PageHeader>
      <section className="container-site pb-20 md:pb-26">
        <Prose>
          <p>
            {agent.name} wants everyone to be able to use this website, including people with disabilities, in the spirit
            of the Accessibility for Ontarians with Disabilities Act (AODA).
          </p>

          <h2>What we’ve done</h2>
          <p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.0 Level AA. The site:</p>
          <ul>
            <li>uses text and background colours with enough contrast to read easily;</li>
            <li>works with a keyboard, with a visible focus outline and a “Skip to main content” link;</li>
            <li>labels every form field and explains form errors in words, not just colour;</li>
            <li>gives images text descriptions;</li>
            <li>
              respects your device’s “reduce motion” setting: the opening animation, photo rotation, review carousel and
              badge effects are turned off or paused;
            </li>
            <li>adapts to phones, tablets and zoomed-in text.</li>
          </ul>

          <h2>Known limitations</h2>
          <p>
            Some content comes from others, such as listing photos and Google reviews, and may not always include full text
            descriptions. We’re working to improve this.
          </p>

          <h2>Need help or found a problem?</h2>
          <p>
            If anything on this site is hard to use, or you’d like information in another format, contact {agent.firstName}{" "}
            and we’ll help: <a href={`mailto:${agent.email}`}>{agent.email}</a> or{" "}
            <a href={agent.phoneHref}>{agent.phone}</a>. Service is available in English and Tamil.
          </p>
        </Prose>
      </section>
    </>
  );
}
