import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.agent.name} and ${site.name} collect, use and protect your personal information.`,
  alternates: { canonical: "/privacy" },
};

// Drafted from what the site actually collects (forms, Firestore, Resend, Netlify).
// PK and the brokerage should review before launch; update the date when it changes.
const UPDATED = "November 18, 2026";

export default function PrivacyPage() {
  const { agent, brokerage, office } = site;
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy policy">
        <p>Last updated {UPDATED}</p>
      </PageHeader>
      <section className="container-site pb-20 md:pb-26">
        <Prose>
          <p>
            This website is operated by {agent.name}, {agent.title} with {brokerage.name}, Brokerage (“{agent.firstName}”,
            “we”). We respect your privacy and handle personal information in line with Canada’s Personal Information
            Protection and Electronic Documents Act (PIPEDA) and Canada’s Anti-Spam Legislation (CASL).
          </p>

          <h2>What we collect</h2>
          <p>We only collect what you choose to send us through the forms on this site:</p>
          <ul>
            <li>
              <strong>Contact form:</strong> your name, email, phone number (optional), what you’re interested in, and
              your message.
            </li>
            <li>
              <strong>Free home evaluation:</strong> your name, email, phone number (optional), and your property’s
              address, city, type and your timeline.
            </li>
            <li>
              <strong>Newsletter:</strong> your email address and your consent to receive emails.
            </li>
          </ul>
          <p>
            With each form we also record the date, the page you sent it from, and whether you agreed to receive marketing
            emails (with the exact consent wording you saw), so we can show we have your permission.
          </p>
          <p>
            We don’t use advertising or analytics trackers, and we don’t build profiles of visitors. Our hosting provider
            keeps standard technical logs (such as IP address and browser type) for security and to keep the site running.
          </p>

          <h2>How we use it</h2>
          <ul>
            <li>To reply to your enquiry and provide the real estate services you ask about.</li>
            <li>To prepare your home evaluation.</li>
            <li>
              To send market updates and new listings, <strong>only if you opted in</strong>. Every email includes a way to
              unsubscribe, and you can also ask us at any time.
            </li>
            <li>To meet legal and regulatory record-keeping requirements that apply to real estate brokerages in Ontario.</li>
          </ul>
          <p>We never sell or rent your personal information.</p>

          <h2>Who we share it with</h2>
          <ul>
            <li>
              <strong>{brokerage.name}, Brokerage:</strong> as a registered salesperson, {agent.firstName} works through
              this brokerage, which may access records as required by Ontario’s Trust in Real Estate Services Act.
            </li>
            <li>
              <strong>Service providers</strong> that run the site for us, under their own privacy and security terms:
              Google Firebase (secure database, stored in Toronto, Canada), Netlify (website hosting) and Resend (to email
              us when you send a form). They may process data outside Canada, where it can be subject to local laws.
            </li>
            <li>When required by law.</li>
          </ul>
          <p>
            Reviews shown on our homepage come from Google Maps. When you view them, your browser loads reviewers’ profile
            photos from Google.
          </p>
          <p>
            The homepage also shows Instagram reels using Instagram’s official embed. When they load, Instagram (Meta) may
            set cookies and collect information under{" "}
            <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer">
              Instagram’s privacy policy
            </a>
            .
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep enquiries only as long as needed to help you and to meet record-keeping rules, and delete them when they
            are no longer needed. Newsletter details are removed when you unsubscribe, except a record of your consent and
            unsubscribe that we must keep.
          </p>

          <h2>Cookies and local storage</h2>
          <p>
            The site itself doesn’t use tracking cookies (embedded Instagram reels may; see above). It uses your browser’s session storage to remember that you’ve already
            seen the opening animation during a visit. The admin area uses a cookie to keep {agent.firstName} signed in;
            visitors never receive it.
          </p>

          <h2>Your choices and rights</h2>
          <p>
            You can ask to see the personal information we hold about you, correct it, withdraw your consent or have it
            deleted (subject to legal record-keeping requirements). Email{" "}
            <a href={`mailto:${agent.email}`}>{agent.email}</a> and we’ll respond within 30 days.
          </p>
          <p>
            If you’re not satisfied with our response, you can contact the Office of the Privacy Commissioner of Canada at{" "}
            <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer">
              priv.gc.ca
            </a>
            .
          </p>

          <h2>Contact</h2>
          <p>
            {agent.name}, {agent.title}
            <br />
            {brokerage.name}, Brokerage
            <br />
            {office.street}, {office.city}, {office.region} {office.postalCode}
            <br />
            <a href={`mailto:${agent.email}`}>{agent.email}</a> · {agent.phone}
          </p>
          <p>
            See also our <Link href="/terms">terms of use</Link>.
          </p>
        </Prose>
      </section>
    </>
  );
}
