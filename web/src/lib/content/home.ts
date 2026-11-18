/**
 * Homepage content. Bracketed values are placeholders: replace them with
 * verified figures and real client reviews before launch (RECO advertising
 * rules require claims to be accurate).
 */

export type RecentSale = {
  address: string;
  city: string;
  listPrice: number;
  status: "sold-over-asking" | "leased-over-asking";
  image: string;
  imageAlt: string;
};

export const recentSales: RecentSale[] = [
  {
    address: "27 Aldgate Crescent",
    city: "[City]",
    listPrice: 689_000,
    status: "sold-over-asking",
    image: "/images/listings/27-aldgate-crescent.jpg",
    imageAlt: "Front of 27 Aldgate Crescent, a two-storey stone and brick detached home",
  },
  {
    address: "38 Soldier Crescent",
    city: "[City]",
    listPrice: 499_000,
    status: "sold-over-asking",
    image: "/images/listings/38-soldier-crescent.jpg",
    imageAlt: "Exterior of 38 Soldier Crescent",
  },
  {
    address: "1778 Silver Maple Drive",
    city: "[City]",
    listPrice: 599_900,
    status: "sold-over-asking",
    image: "/images/listings/1778-silver-maple-drive.jpg",
    imageAlt: "Exterior of 1778 Silver Maple Drive",
  },
  {
    address: "2220 Lakeshore Avenue",
    city: "[City]",
    listPrice: 499_900,
    status: "sold-over-asking",
    image: "/images/listings/2220-lakeshore-avenue.jpg",
    imageAlt: "Condominium tower at 2220 Lakeshore Avenue",
  },
];

export const stats = [
  { value: "$75M+", label: "In career sales", detail: "Across Durham & the East GTA" },
  { value: "150+", label: "Homes sold", detail: "For buyers and sellers" },
  { value: "12+", label: "Years in real estate", detail: "Including development and new builds" },
  { value: "[#.#]★", label: "Google rating", detail: "From [##] client reviews" },
];

/** Short stats beside PK's portrait in the hero. */
export const heroStats = [
  { value: "12+", label: "Years in real estate" },
  { value: "150+", label: "Homes sold" },
  { value: "[#.#]★", label: "Google rating" },
];

export const services = [
  {
    icon: "search",
    title: "Buy a home",
    body: "New listings first, honest advice on value and a strong negotiator on your side.",
    cta: "Start your search",
    href: "/search",
  },
  {
    icon: "home",
    title: "Sell your home",
    body: "Pricing, staging, photography and video, and a marketing plan built for your home.",
    cta: "Selling with PK",
    href: "/sell",
  },
  {
    icon: "chart",
    title: "Free home evaluation",
    body: "A personal estimate from recent sales near you, with no obligation to list.",
    cta: "Get my estimate",
    href: "/home-evaluation",
    highlight: true,
  },
] as const;

export const testimonials = [
  { quote: "[Verified Google review from a seller, in their own words.]", name: "[Client name]", context: "Sold in [City]" },
  { quote: "[Verified Google review from a first-time buyer.]", name: "[Client name]", context: "Bought in [City]" },
  { quote: "[Verified Google review from an investor or landlord.]", name: "[Client name]", context: "Investor" },
];

export const insights = [
  { date: "[Month YYYY]", title: "[Durham market report: what changed this month]", href: "/market-reports" },
  { date: "[Month YYYY]", title: "[Ajax vs. Whitby: where should your family buy?]", href: "/blog" },
  { date: "[Month YYYY]", title: "[First-time buyer incentives in Ontario, explained]", href: "/blog" },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
