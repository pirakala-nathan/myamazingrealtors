import type { MetadataRoute } from "next";
import { getListings } from "@/lib/listings/store";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings();
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/our-listings`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/home-evaluation`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.7 },
    ...listings
      .filter((l) => l.status !== "off-market")
      .map((l) => ({
        url: `${site.url}/listings/${l.slug}`,
        lastModified: l.fetchedAt,
        changeFrequency: "weekly" as const,
        priority: l.status === "active" ? 0.8 : 0.5,
      })),
  ];
}
