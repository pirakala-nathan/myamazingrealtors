/**
 * Site-wide facts. Anything wrapped in [BRACKETS] is a placeholder that must be
 * replaced with real, verified information before launch.
 */
export const site = {
  name: "My Amazing Realtors",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.myamazingrealtors.com",
  tagline: "Serving you with honesty & integrity",
  description:
    "PK Sithamparanathan, Realtor® serving Pickering, Ajax, Whitby, Oshawa, Scarborough, Markham and the East GTA. Search homes, get a free home evaluation and book a call.",

  brokerage: {
    // Legal name as shown on PK's PropTx data licence agreement.
    name: "RE/MAX Community Realty Inc.",
    legalLine: "RE/MAX Community Realty Inc., Brokerage. Each office independently owned and operated.",
  },

  agent: {
    name: "PK Sithamparanathan",
    firstName: "PK",
    title: "Sales Representative",
    phone: "647.892.2124",
    phoneHref: "tel:+16478922124",
    smsHref: "sms:+16478922124",
    email: "pk@myamazingrealtors.com",
    photo: "/images/team/pk-sithamparanathan.jpg",
    intro:
      "An excellent negotiator with a proven track record, PK has been trading in real estate for over 12 years. Strong sales acumen and hands-on experience in real estate development and building mean you get sharp advice on value, condition and potential. Serving you with honesty & integrity.",
  },

  office: {
    street: "282 Consumers Road, Unit 10",
    city: "North York",
    region: "ON",
    postalCode: "M2J 1P8",
    country: "CA",
    phone: "416-287-2222",
    phoneHref: "tel:+14162872222",
  },

  social: {
    instagram: "https://www.instagram.com/myamazingrealtors/",
    facebook: "https://www.facebook.com/myamazingrealtors",
    youtube: null as string | null,
  },

  /** Google Business Profile place ID, used for the live Google rating and reviews. GOOGLE_PLACE_ID overrides it. */
  googlePlaceId: "ChIJx1bJv07R1IkRMjJOlbVNvr0",

  serviceAreas: ["Pickering", "Ajax", "Whitby", "Oshawa", "Scarborough", "Markham"],
} as const;

/**
 * Search engines may index the site only when ALLOW_INDEXING=true is set on the
 * production deploy (read at build time). Leave it unset on test sites and until launch.
 */
export const allowIndexing = process.env.ALLOW_INDEXING === "true";

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "About PK", href: "/about" },
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Listings", href: "/our-listings" },
  { label: "Communities", href: "/communities" },
  { label: "Contact", href: "/contact" },
];
