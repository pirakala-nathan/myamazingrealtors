import type { MetadataRoute } from "next";
import { allowIndexing, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Until launch (ALLOW_INDEXING=true), block all crawling so test sites stay out of search results.
    rules: allowIndexing
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
