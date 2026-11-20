import { site } from "@/lib/site";

/** Renders a JSON-LD script tag, escaping `<` so content can't break out of the tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Tells Google the site's name, which it shows above the title in search results. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: [`${site.agent.name}, Realtor®`, "MyAmazingRealtors.com"],
    url: `${new URL(site.url).origin}/`,
  };
}

export function realEstateAgentSchema() {
  const sameAs = [site.social.instagram, site.social.facebook, site.social.youtube].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: `${site.agent.name} — ${site.name}`,
    url: site.url,
    image: new URL(site.agent.photo, site.url).toString(),
    logo: new URL("/icons/icon-512.png", site.url).toString(),
    telephone: site.agent.phone,
    email: site.agent.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.office.street,
      addressLocality: site.office.city,
      addressRegion: site.office.region,
      postalCode: site.office.postalCode,
      addressCountry: site.office.country,
    },
    knowsLanguage: site.agent.languages,
    areaServed: site.serviceAreas.map((name) => ({ "@type": "City", name })),
    parentOrganization: { "@type": "RealEstateAgent", name: `${site.brokerage.name}, Brokerage` },
    sameAs,
  };
}
