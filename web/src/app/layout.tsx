import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { allowIndexing, site } from "@/lib/site";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { JsonLd, realEstateAgentSchema } from "@/components/seo/json-ld";
import { Intro } from "@/components/layout/intro";
import { ThemeScript } from "@/components/layout/theme-script";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.agent.name}, Realtor® | Pickering, Ajax, Whitby & East GTA Real Estate`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_CA",
    images: [{ url: "/images/listings/27-aldgate-crescent.jpg", width: 1920, height: 1291 }],
  },
  alternates: { canonical: "/" },
  // Test sites and pre-launch deploys stay out of search results (see allowIndexing).
  robots: allowIndexing ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a1d28",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: before React loads, the theme script sets data-theme on <html> and the
    // intro script briefly locks page scroll.
    <html lang="en-CA" className={`${cormorant.variable} ${manrope.variable} antialiased`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col pb-24 md:pb-0">
        <ThemeScript />
        <Intro />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-navy-900 focus:px-4 focus:py-3 focus:text-on-dark"
        >
          Skip to main content
        </a>
        <AnnouncementBar />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <MobileActionBar />
        <JsonLd data={realEstateAgentSchema()} />
      </body>
    </html>
  );
}
