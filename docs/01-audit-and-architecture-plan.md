# My Amazing Realtors — Website Audit, Strategy & Architecture Plan

**Status:** Draft for approval (no code written yet)
**Date:** 2026-11-11
**Scope:** Rebuild of myamazingrealtors.com on Next.js + TypeScript + Tailwind CSS + Supabase + Vercel

> **Decisions made after approval (2026-11-11), which override the sections below**
> - **Single Realtor.** PK Sithamparanathan is the only Realtor on the site. Read every "team" or "agent" item below as PK only:
>   - `/team` and `/team/[agent-slug]` become **`/about`** (PK's profile page).
>   - The `agents` table is dropped. The `agent` role is dropped, so leads are visible to `owner` and `admin` only.
>   - The admin "Team" module is removed.
> - **Design direction C, "Harbour Navy & Logo Cyan"** (palette switched from noir and champagne on 2026-11-18 to match the logo), is a personal-brand homepage inspired by the structure of personal-brand broker sites. The look and copy are original. See `docs/02-design-system.md`.
> - **Code layout.** The app lives in `web/`; set Netlify's Base directory to `web`.
> - **Brokerage.** RE/MAX Community Realty Inc., Brokerage (exact legal spelling to confirm with RECO).
> - **Smaller scope and simpler stack (2026-11-11).** These replace the Supabase/Vercel architecture, CRM, client accounts and schema described below:
>   - **Hosting: Netlify** (free plan allows business sites) instead of Vercel Pro.
>   - **Data: Firebase** (Firestore and Storage) instead of Supabase. Browsers have no direct database access; the server uses the Admin SDK.
>   - **Only three things are captured:** contact form, free home evaluation, newsletter sign-up. Each is saved to Firestore and emailed to PK. Newsletter sign-ups move to an email platform (Mailchimp or Brevo) once chosen.
>   - **No CRM:** no lead pipeline, activities, showing requests, client accounts, favourites or saved searches.
>   - **Listings:** PK adds his own listings in a small admin page by MLS® number, and the site pulls the details from TRREB data via PropTx once access is approved through the brokerage. Until then, listings are typed in by hand with photo upload. A full TRREB search can be added later on the same data connection.

---

## STEP 1 — Audit of the existing website

### 1.1 How the site is actually served (verified)

| Check | Result |
|---|---|
| `https://www.myamazingrealtors.com` | **Times out. HTTPS does not work.** |
| `https://myamazingrealtors.com` | **Times out.** |
| `http://myamazingrealtors.com` / `http://www.…` | 200 OK, but the response is a 398-byte **HTML frameset**, not the site |
| Frameset target | `http://s3.amazonaws.com/www.myamazingrealtors.com/index.html` (an Amazon S3 bucket) |
| Domain IPs | `3.33.152.147`, `15.197.142.173`. These are AWS Global Accelerator addresses, which are typically used by registrar "forwarding with masking" services. Please confirm with your registrar. |
| S3 file last modified | 25 March 2021 |
| Footer copyright | 2017 |
| `robots.txt`, `sitemap.xml` | 404 on the domain, 403 on S3 |
| Other pages (`/about`, `/listings`, etc.) | None. **This is a one-page site.** |

**What this means:** Google and visitors only ever see a wrapper page titled `MYAMAZINGREALTORS.COM` with an empty meta description. The real content sits on an `amazonaws.com` URL, so the content's SEO value goes to Amazon's domain, not yours. Browsers label the site **"Not secure"**. The wrapper page also has no `viewport` meta tag. Because of that, phones that load the domain will probably show the desktop layout zoomed out, even though the framed page is responsive. (I tested the framed page directly at 375px wide. The wrapper behaviour is inferred from its markup.)

### 1.2 Current structure and content inventory

The site is a single scrolling page. It was built from the free **Start Bootstrap "Freelancer"** template (Bootstrap 3, jQuery, Font Awesome 4).

| Section | Content |
|---|---|
| Nav | Logo · New Listings · Search Properties · Our Team · Contact (anchor links) |
| Hero carousel (3 slides) | "Let Us Help You Find Your Perfect Home!" / "Looking For Investment Opportunities?" / "Stressed With the Current Market Conditions?" |
| Intro header | "My Amazing Realtors". Tagline: **"Serving You With Honesty & Integrity"** |
| Current Listings (7 cards) | 78 Ventura Lane (leased over asking, $1,750) · 81 Butson Crescent ($799,900) · 27 Aldgate Crescent (sold over asking, $689,000) · 38 Soldier Crescent (sold over asking, $499,000) · 2220 Lakeshore Avenue (sold over asking, $499,900) · 1778 Silver Maple Drive (sold over asking, $599,900) · 61 Rotunda Avenue (sold over asking, $549,900) |
| Search Properties | **Empty.** The section has no content. |
| Our Team | PK Sithamparanathan (647.892.2124, pk@…) · Sri Lankeswaran (647.997.7492, sri@…) |
| Contact form | Name, Email, Phone, "How did you hear about us?" (posts to Formspree) |
| Footer | 300 Rossland Road East, Unit 404, Ajax, ON L1Z 0K4 · 905-239-9222 · Facebook · Twitter (dead `#` link) · Instagram |

### 1.3 Outdated design and usability problems

1. **Generic template look.** It uses a stock glass-tower hero image (not a GTA home or neighbourhood), Bootstrap 3 styling, and all-caps headings. It feels like a 2015 freelancer portfolio, not a luxury brokerage.
2. **Huge blank areas.** The empty Search section is followed by seven `<br>` tags. A large blank band also appears under the "My Amazing Realtors" heading on desktop.
3. **The listing cards lead nowhere.** Every card links to `#`. There are no detail pages, galleries, or descriptions, and two cards share the same photo (`House.jpg`).
4. **Template leftovers still ship.** A hidden "Project Title" modal still links to Start Bootstrap and a cabin icon, and still loads `cabin.png`.
5. **Auto-rotating carousel.** The 3 headlines change every 4 seconds. Carousels like this are known to lower engagement and cause accessibility problems.
6. **The "Search Properties" nav item is a dead end.** It is the main thing buyers want, and it does nothing.
7. **No individual agent bios,** credentials, reviews, or testimonials.
8. **Stale signals.** The copyright says 2017 and the newest content is from 2021.

### 1.4 Mobile responsiveness

- The framed page itself is responsive (Bootstrap grid, collapsing "MENU" button), and there is no horizontal scroll at 375px.
- On mobile, the hero headline wraps to 6 lines and fills the whole first screen without telling visitors what you offer.
- There is no tap-to-call or tap-to-text link. Phone numbers are plain text.
- On real phones, the domain's frameset wrapper probably breaks responsive scaling (see 1.1).

### 1.5 Performance

| Asset | Displayed at | Actual size |
|---|---|---|
| Agent photo `sri.jpg` | 240px circle | **949 KB**, 1404×1528 |
| Agent photo `pk.jpg` | 250px circle | 481 KB |
| Listing thumbnails (`butson`, `House`, `lakeshore`) | ~260px card | 460–510 KB each, 1920px wide |
| Logo `mainlogo.png` | header | 199×107 PNG (too low-resolution for retina screens; no vector version) |

There is no image optimization, lazy loading, or modern formats (WebP/AVIF). jQuery, Bootstrap and an icon font block rendering.

### 1.6 SEO findings

- **The indexable page is the frameset.** Its title is `MYAMAZINGREALTORS.COM`, and it has an empty description and empty keywords.
- The inner page's title is "My Amazing Realtors" and its meta description is empty.
- There is no `<h1>` that targets a location. The words "Pickering", "Ajax", "Whitby", "Oshawa", "Scarborough", "Markham" and "Durham" **do not appear anywhere on the site** except the Ajax office address.
- There is no structured data (`RealEstateAgent` / `LocalBusiness`), no sitemap, no robots.txt, and no canonical tag.
- There is no HTTPS, which is a ranking and trust factor.
- Alt text is weak or wrong: images are labelled with street names only, and the "Aldgate" label is reused on the Ventura listing.
- Because there is only one page, there is nothing to rank for "homes for sale in Whitby", "sell my house Ajax" and similar searches.
- There is no analytics or Search Console verification in the markup.

### 1.7 Conversion weaknesses

1. **The contact form has no "message" field** and no way to say *buying / selling / renting / investing*.
2. **The form posts directly to Formspree with your email in the HTML.** That email is easy for spammers to harvest, and there is no spam protection.
3. **The "thank you" flow is broken.** `_next` is set to `#ModalContact`, which is not a valid redirect URL.
4. **"Random"** is one of the "How did you hear" options.
5. There is **no seller lead magnet** (free home evaluation), which is usually the highest-value lead for a listing agent.
6. There is **no reason to register**: no saved searches, listing alerts, or market reports.
7. There is **no "Book a showing"** or "Book a call" option.
8. Phone numbers are not clickable, and there is no WhatsApp, SMS or sticky mobile call bar.
9. There is **no social proof** (reviews, sold stats, testimonials), apart from the "sold over asking" labels.
10. The HTTP "Not secure" warning discourages people from submitting personal details.
11. There is no privacy policy or consent checkbox (PIPEDA / CASL).

### 1.8 Compliance gaps to fix in the rebuild (please verify with your brokerage)

- **The brokerage name does not appear anywhere on the site.** Ontario's TRESA/RECO advertising rules generally require the registered brokerage name to be shown clearly and prominently in advertising. Each agent should also be identified by their registered title (e.g. "Sales Representative").
- "Sold over asking" claims must be accurate and verifiable. Sold-price data from MLS feeds has its own display rules (see 4.1).
- Ontario's AODA accessibility standard applies. The target is WCAG 2.1 AA.

### 1.9 What to keep

| Keep | Notes |
|---|---|
| Domain `myamazingrealtors.com` | Fix DNS and HTTPS. This is the most important asset. |
| Brand name and logo | The roof and house mark in blue/teal. **Please send the original vector file** (AI/SVG/PDF), or I will redraw it. |
| Tagline "Serving You With Honesty & Integrity" | Good trust message; keep it as a brand line. |
| Agent names, phones, emails, headshots | Re-shoot or re-crop the headshots at high resolution if possible. |
| Office address and phone | Must match your Google Business Profile exactly (consistent name, address, phone). |
| Past transactions (6 sold/leased) | Becomes a "Recent Successes" or track-record section with full case-study pages. |
| Instagram and Facebook links | Remove the dead Twitter link unless an account exists. |
| URLs | Only `/` exists, so there are no deep links to redirect. The old S3 bucket must be retired or redirected so it does not compete as duplicate content. |

---

## STEP 2 — Competitive research: patterns worth adopting

This section summarizes widely used patterns from luxury brokerages, high-converting agent sites, and the Canadian portals your buyers already use (it is not a fresh crawl of each site). We'll adopt the **patterns** with our own original design and copy. Nothing will be copied from another company.

| Pattern | Seen at | Why it matters for you |
|---|---|---|
| Full-bleed cinematic hero (video or photo) with a **search bar in the hero** | Luxury brokerages | Buyers start searching straight away; looks premium |
| Generous whitespace, serif display font plus a clean sans-serif, muted palette with one accent colour | Luxury brokerages | Reads as "luxury" more than heavy colour does |
| **Map + list split-view search**, draw-on-map, "sold" and "days on market" data | Canadian consumer portals | Ontario buyers now expect this |
| **Sold and price-history data behind a free account** | Canadian portals (VOW model) | Strong registration incentive, and meets MLS VOW rules |
| **Instant home evaluation** landing page | High-converting agent sites | The No. 1 seller lead source |
| Saved searches, favourites, **email alerts** | All major portals | Repeat visits and nurture; leads arrive already qualified |
| **Neighbourhood / community guides** (schools, transit, lifestyle, market stats) | Top local agents | Local SEO and authority |
| Monthly **market report** per city | Top local agents | Content for email and SEO; positions you as experts |
| Sticky mobile action bar (Call · Text · Book) | High-converting agent sites | Biggest mobile conversion lift |
| Agent profile pages with reviews, designations, languages, sold history | Brokerages | Trust, and people hire people |
| Listing pages with gallery, floor plans, virtual tour, mortgage calculator, schedule-a-showing | Portals and brokerages | Reduces friction before a showing request |
| Exclusive and "coming soon" listings | Luxury brokerages | Gives a reason to register and contact you |

---

## STEP 3 — Recommended website strategy

### 3.1 Positioning

**"Durham & East GTA real estate, with honesty and integrity."** The site should look premium, like a boutique luxury brokerage, while staying warm and approachable for first-time buyers and investors.

### 3.2 Visual direction (to be confirmed with a moodboard in Milestone 1)

- **Palette:** deep navy/ink (evolved from the current dark header), warm ivory background, and one refined accent. Options are a brass/champagne gold, or a deeper version of your logo's teal so the brand stays continuous.
- **Type:** an elegant serif for headings and a modern sans-serif for body and UI text.
- **Imagery:** real Durham and GTA homes and neighbourhoods (Ajax waterfront, Pickering, Whitby harbour, and so on), large and full-bleed, with subtle motion.
- **Tone:** confident, local and specific: "Sold 27 Aldgate Cres. over asking", not "We're the best!".

### 3.3 Conversion funnels

| Audience | Entry points | Offer / CTA | Captured |
|---|---|---|---|
| **Sellers** | Home page, city pages, "Sell" page, Google Ads | Free home evaluation (address, then details, then contact), "What's my home worth?" | Address, timeline, contact |
| **Buyers** | Search, listing pages, city pages | Save search / alerts, see sold prices, book a showing | Account, search criteria, showing request |
| **Investors** | "Invest" page, blog | Investment guide, cash-flow calculator, call booking | Budget, goals |
| **Renters / landlords** | Lease listings | Lease inquiry, landlord services | Contact |
| **Everyone** | Sticky bar and footer | Call / Text / Book a call | Phone tap, booking |

Every form will have a clear next step, an instant confirmation email, and an instant alert to the agent (email + SMS), with a target response time under 5 minutes.

### 3.4 Success metrics

Lead form conversion rate, evaluation requests, registered users, showing requests, calls and texts from mobile, organic sessions to city pages, Core Web Vitals passing on all key templates, and top-10 rankings for "[city] real estate agent" / "homes for sale [city]".

---

## STEP 4 — Technical architecture

### 4.1 Key dependency: MLS listing data (start this now)

"Advanced property search" for Pickering, Ajax, Whitby, Oshawa, Scarborough and Markham needs a licensed MLS data feed. In this area that is normally **TRREB MLS data, delivered through PropTx's RESO Web API**. Durham Region listings are generally in this system too. Please confirm through your brokerage.

- **IDX feed:** active listings, shown publicly.
- **VOW feed:** sold and historical data, shown only to registered, logged-in users who accept terms of use.
- **Requirements:** the brokerage of record has to sign the data licence agreements. There may be monthly fees. Each feed has display rules (brokerage attribution, disclaimers, refresh frequency, removing delisted properties).
- **Lead time:** approval can take weeks, so **this is the critical path**. Until the feed is approved we will build search against your own listings plus a sample dataset, so nothing else waits on it.

**Fallback:** if a direct feed is not possible, we can embed or proxy a licensed third-party IDX provider. This is faster, but gives less design control and weaker SEO.

### 4.2 Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (latest stable), App Router, React Server Components, TypeScript strict mode** | SEO-friendly server rendering, ISR for listings, one codebase for the site and admin |
| Styling | **Tailwind CSS** plus a small in-house component library (Radix primitives for accessible menus, dialogs and sliders) | Fast, consistent, premium custom look |
| Database / Auth / Storage | **Supabase**: Postgres + **PostGIS** for map search, Auth (email magic link + Google), Storage for images and documents, Row Level Security | One managed backend; secure, role-based access |
| Hosting | **Vercel**: Edge network, image optimization, preview deployments per pull request, Cron Jobs | Zero-ops hosting, fast in Canada |
| Maps | MapLibre GL + a hosted tile provider (MapTiler or Mapbox) | Smooth map search; cost control |
| Email | Resend (transactional + alerts) with React Email templates | Reliable delivery, branded emails |
| SMS alerts to agents | Twilio (optional) | Instant lead response |
| Spam protection | Cloudflare Turnstile + rate limiting | No CAPTCHA friction |
| Booking | Built-in showing-request flow; optional Cal.com embed for agent calendars | Showings tied to listings |
| Analytics | GA4 + Google Search Console + Vercel Analytics/Speed Insights; conversion events | Measure each funnel |
| Validation | Zod (shared between client and server) | Type-safe forms and APIs |
| Rich content | Tiptap editor in admin, stored as JSON and rendered on the server | Agents can edit pages without code |
| Testing | Vitest (unit), Playwright (end-to-end), axe (accessibility), Lighthouse CI | Quality gates before deploy |

### 4.3 Sitemap

```
/                                   Home
/search                             Map + list property search (IDX)
/listings/[mlsId]-[address-slug]    Listing detail (MLS & exclusive)
/our-listings                       Our active, sold & leased portfolio
/our-listings/[slug]                Case study / featured listing
/sold                               Sold data search (VOW — login required)
/buy                                Buyer services + buyer guide
/sell                               Seller services + marketing plan
/home-evaluation                    Instant home evaluation funnel
/invest                             Investor services + calculators
/rent                               Leasing (tenants & landlords)
/communities                        Community hub (map of areas)
/communities/[city]                 Pickering, Ajax, Whitby, Oshawa, Scarborough, Markham, Toronto…
/communities/[city]/[neighbourhood] e.g. /communities/ajax/south-east-ajax
/market-reports                     Market report index
/market-reports/[city]/[yyyy-mm]    Monthly city report
/team                               Team overview
/team/[agent-slug]                  Agent profile (bio, reviews, listings, sold)
/reviews                            Testimonials / Google reviews
/blog                               Insights
/blog/[slug]                        Article
/contact                            Contact + office map + booking
/book                               Book a call / showing
/account                            Dashboard: saved homes, saved searches, alerts
/account/login                      Magic-link / Google sign-in
/privacy  /terms  /accessibility    Legal (PIPEDA, CASL, AODA, MLS disclaimers)
/sitemap.xml  /robots.txt
/admin/...                          Admin dashboard (protected — see 4.4)
```

### 4.4 Page-by-page feature breakdown

| Page | Key features |
|---|---|
| **Home** | Cinematic hero with search (location, price, beds, type) · Featured and exclusive listings carousel · "What's your home worth?" band · Communities grid (6 cities) · Track record stats (homes sold, % over asking, avg days on market, from your own data) · Testimonials · Team · Latest market report · Brokerage attribution · Sticky mobile action bar |
| **Search** | Split map/list (list only on mobile, with a map toggle) · Filters: price, beds, baths, type, style, sq ft, lot, parking, basement apt, open houses, days on market, keywords · Draw-on-map polygon · Sort · Save search (requires login) · URL-encoded filters so searches can be shared and indexed · Infinite/paginated results · Comparing listings |
| **Listing detail** | Photo gallery + fullscreen lightbox · Key facts, room dimensions, taxes, maintenance fees · Virtual tour / video · Map + nearby schools/transit · Mortgage & land-transfer-tax calculator (Ontario + Toronto municipal LTT) · Price history (VOW-gated) · Similar listings · **Book a showing** (date/time preferences) · Ask a question · Share/favourite · Agent card · MLS disclaimer · `RealEstateListing` schema |
| **Our Listings** | Your own active, sold and leased listings with "sold over asking" badges, and a case study for each |
| **Home Evaluation** | Multi-step form: address autocomplete, property details, timeline, contact. An instant estimate range comes later (Phase 2) or is reviewed by an agent. CMA booked within 24h |
| **Sell** | Marketing plan (staging, photography, video, social), process timeline, fee/value proposition, seller success stories, evaluation CTA |
| **Buy** | Process guide, first-time buyer programs (Ontario land transfer tax rebate, FHSA), mortgage partner CTA, "get alerts" CTA |
| **Invest** | Rental yield / cash-flow calculator, pre-construction & multi-unit info, investor consult booking |
| **Communities / City / Neighbourhood** | Unique editorial content (lifestyle, schools, transit/GO, amenities), live market stats from the feed, active listings embed, FAQ with `FAQPage` schema, local CTAs |
| **Market Reports** | Monthly stats (median price, sales, new listings, DOM, sale-to-list ratio) with charts, agent commentary, email subscribe |
| **Team / Agent** | Bio, registration title, languages, designations, contact buttons, reviews, active and sold listings, `Person`/`RealEstateAgent` schema |
| **Reviews** | Google reviews feed + curated testimonials, `Review`/`AggregateRating` (only where allowed) |
| **Blog** | Categories, author, related posts, newsletter CTA |
| **Contact / Book** | Smart form (I'm buying/selling/renting/investing), click-to-call/text/WhatsApp, office map, hours, booking calendar |
| **Account** | Favourites, saved searches with alert frequency (instant/daily/weekly), viewing history, profile, communication preferences (CASL) |

**Admin dashboard (`/admin`)**

| Module | Features |
|---|---|
| Overview | KPIs: new leads, leads by source, response time, top listings, registrations, form conversion |
| Leads / CRM | Pipeline (New → Contacted → Qualified → Showing → Offer → Closed / Lost), assign to agent, notes, tasks and reminders, activity timeline (pages viewed, favourites, searches), CSV export, optional Follow Up Boss / Zapier webhook |
| Showings | Requests calendar, confirm/reschedule, automatic emails |
| Listings | Manage exclusive/own listings (photos, details, status sold/leased/over-asking), feature/pin MLS listings, open houses |
| Content | Pages (home sections, sell/buy text), communities, blog, market reports, testimonials, FAQs, all edited in Tiptap with SEO fields (title, description, OG image) |
| Media library | Uploads to Supabase Storage, automatic resizing, alt text required |
| Team | Agent profiles, roles |
| Settings | Brokerage info, office details, social links, notification routing, redirects manager |
| Roles | `owner`, `admin`, `agent` (sees own leads), `editor` (content only) |

### 4.5 Component architecture

```
src/
  app/
    (marketing)/          # Public pages — server components, ISR
      page.tsx            # Home
      search/ listings/ communities/ market-reports/ team/ blog/ sell/ buy/ ...
    (account)/account/    # Authenticated consumer area
    admin/                # Protected admin (role-gated layout)
      leads/ showings/ listings/ content/ media/ team/ settings/
    api/                  # Route handlers (webhooks, cron, public APIs)
    sitemap.ts  robots.ts  layout.tsx  not-found.tsx
  components/
    ui/                   # Design system: Button, Input, Select, Dialog, Sheet, Tabs,
                          #   Badge, Card, Skeleton, Toast, Slider, Combobox (Radix + Tailwind)
    layout/               # Header (mega-menu), MobileNav, Footer, StickyActionBar, BrokerageBar
    marketing/            # Hero, SearchHero, StatsBand, CommunityGrid, TestimonialCarousel,
                          #   CTASection, TeamGrid, MarketSnapshot, TrackRecord
    listings/             # ListingCard, ListingGrid, ListingGallery, Lightbox, ListingFacts,
                          #   PriceHistory (VOW-gated), SimilarListings, MlsDisclaimer
    search/               # SearchFilters, FilterSheet (mobile), MapView (client), DrawTool,
                          #   ResultsList, SortMenu, SaveSearchButton
    forms/                # LeadForm, ShowingRequestForm, EvaluationWizard, ContactForm,
                          #   NewsletterForm — all Zod + server actions + Turnstile
    tools/                # MortgageCalculator, LandTransferTaxCalculator, CashFlowCalculator
    content/              # RichText renderer, FAQ, Breadcrumbs, AuthorBox
    admin/                # DataTable, KanbanPipeline, LeadTimeline, Editor (Tiptap),
                          #   MediaPicker, StatCard, Charts
    seo/                  # JsonLd helpers (RealEstateAgent, RealEstateListing, FAQ, Breadcrumb)
  lib/
    supabase/             # server/client/admin clients, typed (generated types)
    mls/                  # PropTx RESO client, mappers, sync jobs, compliance rules
    search/               # query builder (filters → SQL/PostGIS)
    email/                # Resend + React Email templates
    validation/           # Zod schemas shared client/server
    seo/  analytics/  utils/
  types/
supabase/
  migrations/  seed.sql  functions/ (edge functions if needed)
```

**Rendering strategy:** Marketing and community pages are static with ISR, revalidated when content changes. Listing pages use ISR with on-demand revalidation when the sync updates a listing. Search uses server-rendered first results plus client-side map interactivity. Account and admin pages are always rendered dynamically.

### 4.6 Database schema (Supabase / Postgres)

```sql
-- People & access
profiles        (id uuid PK → auth.users, full_name, phone, role enum[owner,admin,agent,editor,client],
                 agent_id FK null, marketing_consent bool, consent_at timestamptz, created_at)
agents          (id, slug unique, full_name, title, registration_title, bio_json, phone, email,
                 photo_url, languages text[], designations text[], is_active, sort_order)
brokerage_settings (singleton: brokerage_name, address, phone, logo_url, disclaimers_json, socials_json)

-- Listings
listings        (id, source enum[mls,exclusive], mls_number unique null, status enum[active,
                 conditional,sold,leased,expired,terminated,coming_soon], transaction enum[sale,lease],
                 list_price, sold_price null, sold_over_asking bool generated, property_type, style,
                 beds, beds_plus, baths, sqft_range, lot_front, lot_depth, parking, basement,
                 address_line, unit, city, community, postal_code, province,
                 geo geography(Point,4326), description, features_json, taxes, maintenance_fee,
                 virtual_tour_url, list_date, sold_date, dom, listing_brokerage, our_agent_id FK null,
                 is_featured, slug, raw_json jsonb, mls_updated_at, synced_at, created_at, updated_at)
                 -- indexes: GIST(geo), (city,status,list_price), (status,list_date), GIN(features_json), tsvector on description
listing_media   (id, listing_id FK, url, storage_path null, kind enum[photo,floorplan,video],
                 sort_order, width, height, alt)
open_houses     (id, listing_id FK, starts_at, ends_at, is_virtual)
price_history   (id, listing_id FK, event enum[listed,price_change,sold,leased,terminated], price, event_date)
mls_sync_runs   (id, started_at, finished_at, status, added, updated, removed, error)

-- Geography & content
communities     (id, city, slug, parent_id null, name, geo_boundary geography(Polygon) null,
                 hero_image, content_json, faq_json, seo_title, seo_description, is_published)
market_stats    (id, community_id FK, period date, median_price, avg_price, sales, new_listings,
                 active, avg_dom, sale_to_list_ratio, property_type)
market_reports  (id, community_id FK, period, title, slug, commentary_json, is_published, published_at)
posts           (id, slug, title, excerpt, content_json, cover_image, author_agent_id, category,
                 tags text[], seo_title, seo_description, status enum[draft,published], published_at)
pages           (id, key unique, sections_json, seo_title, seo_description, updated_by, updated_at)
testimonials    (id, agent_id null, client_name, rating, body, source enum[google,direct], is_published)
media_assets    (id, storage_path, alt, width, height, uploaded_by, created_at)
redirects       (id, from_path unique, to_path, status_code)

-- Consumer features
favorites       (user_id FK, listing_id FK, created_at, PK(user_id,listing_id))
saved_searches  (id, user_id FK, name, filters_json, polygon geography null,
                 alert_frequency enum[instant,daily,weekly,off], last_alerted_at)
listing_views   (id, user_id null, anon_id, listing_id, viewed_at)

-- Leads & CRM
leads           (id, type enum[buyer,seller,evaluation,showing,investor,rental,contact,newsletter],
                 status enum[new,contacted,qualified,showing,offer,closed,lost],
                 first_name, last_name, email, phone, message, listing_id null, property_address null,
                 timeline, budget_min, budget_max, source, utm_json, assigned_agent_id FK,
                 user_id null, consent_casl bool, consent_text, ip_hash, created_at, updated_at)
lead_activities (id, lead_id FK, kind enum[note,call,email,sms,status_change,task,system],
                 body, due_at null, completed_at null, actor_id, created_at)
showing_requests(id, lead_id FK, listing_id FK, preferred_times jsonb, confirmed_at null, status)
home_evaluations(id, lead_id FK, address, geo, property_details_json, estimate_low, estimate_high, cma_url)
notifications_log (id, channel, to, template, lead_id null, status, created_at)
```

**Row Level Security:** listings, communities, posts and testimonials are public read when published. Sold and price-history data can only be read by authenticated clients (VOW rule). Favourites and saved searches are visible only to their owner. Admins and owners see all leads, while agents see only their assigned leads. Editors can manage content but cannot see leads.

### 4.7 API architecture

Mutations use **Server Actions**; integrations and anything called from outside use **Route Handlers**. Every input is validated with Zod and rate-limited.

| Endpoint / action | Purpose | Auth |
|---|---|---|
| `GET /api/search` | Filtered + geo search (bbox/polygon, filters, sort, cursor pagination) | Public (sold filters require login) |
| `GET /api/listings/[id]` | Listing JSON for client widgets | Public |
| `GET /api/listings/[id]/history` | Price history | Logged-in client |
| `action createLead()` | All forms (contact, buyer, investor, rental) → lead + emails + SMS | Public + Turnstile |
| `action requestShowing()` | Showing request → lead + showing_requests | Public + Turnstile |
| `action submitEvaluation()` | Home evaluation wizard | Public + Turnstile |
| `action toggleFavorite()`, `saveSearch()`, `updateAlerts()` | Account features | Client |
| `POST /api/cron/mls-sync` | Incremental PropTx replication (every 15–60 min, per licence) | Vercel Cron secret |
| `POST /api/cron/alerts` | Match new listings to saved searches → email digests | Cron secret |
| `POST /api/cron/market-stats` | Monthly stats rollup per community | Cron secret |
| `POST /api/revalidate` | On-demand ISR after content/listing changes | Signed secret |
| `POST /api/webhooks/resend` | Delivery/bounce tracking | Signature |
| `POST /api/webhooks/crm` (optional) | Push leads to Follow Up Boss / Zapier | Signature |
| `admin/*` server actions | CRUD for leads, content, listings, media, team, settings | Role-checked in code + RLS |

### 4.8 SEO strategy

**Technical**
- HTTPS everywhere, a single canonical host (`https://www.myamazingrealtors.com`), and the frameset removed.
- Server-rendered HTML, unique title and description per page, and Open Graph/Twitter images (generated automatically for listings).
- `sitemap.xml` split by type (pages, communities, listings, posts) and `robots.txt`.
- **JSON-LD structured data:** `RealEstateAgent` + `LocalBusiness` (office NAP, geo, hours, sameAs socials), `Person` for agents, `RealEstateListing`/`Offer` for listings, `BreadcrumbList`, `FAQPage`, `Article`.
- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1. Use `next/image` (AVIF/WebP, responsive sizes), self-hosted fonts via `next/font`, and minimal client-side JavaScript.
- Listing hygiene: sold and expired MLS pages become `noindex` or redirect to the community page, per your licence. Filtered search URLs get canonical tags so they do not create index bloat.
- AODA / WCAG 2.1 AA: semantic HTML, focus states, colour contrast, alt text, keyboard-accessible map alternatives.

**Local content (where the rankings come from)**
- One rich page per city: Pickering, Ajax, Whitby, Oshawa, Scarborough, Markham, Toronto. Then neighbourhood pages (for example Ajax: South East Ajax, Northwest Ajax, Pickering Village; Whitby: Brooklin, Port Whitby; Pickering: Duffin Heights, Seaton, Bay Ridges; Oshawa: Windfields, Kedron).
- Each has unique editorial content, live stats, listings, FAQs, schools, and transit/GO access. **No templated filler text.**
- Monthly market reports per city.
- Blog topics: "Selling in Durham in 2027", "Ajax vs Whitby for families", "Ontario land transfer tax explained", "First-time buyer incentives in Ontario", "Legal basement apartments in Durham".
- Target searches like: "[city] real estate agent", "homes for sale in [city]", "sell my house [city]", "[city] home value", "[neighbourhood] homes for sale".

**Off-site**
- Optimize your **Google Business Profile**: categories, photos, weekly posts, and a review-request flow built into the admin after each closing.
- Consistent name/address/phone on citations (RECO, REALTOR.ca profile, Yelp, Facebook, Bing Places, Apple Business Connect).
- Local links from sponsorships, community events, and partner mortgage brokers/lawyers.

### 4.9 Deployment plan

1. **Repositories and environments:** GitHub repo with environments `dev` (local + Supabase local via CLI), `preview` (Vercel preview per PR → Supabase staging project), and `production` (Vercel production → Supabase production project).
2. **Database:** every change is a version-controlled migration in `supabase/migrations`, generated TypeScript types, a seed script, and point-in-time recovery enabled on production.
3. **CI** (GitHub Actions): typecheck, lint, unit tests, Playwright end-to-end tests against the preview deployment, Lighthouse and axe budgets. Merging is blocked if any fail.
4. **Secrets:** stored in Vercel environment variables (Supabase service key server-only, PropTx credentials, Resend, Twilio, Turnstile, cron secret).
5. **Domain cut-over** (in a low-traffic window):
   - Lower the DNS TTL 48h before the switch.
   - Remove registrar forwarding and point the apex/`www` records to Vercel (or move DNS to Vercel). Vercel issues the SSL certificate automatically.
   - Add the 301 from apex to `www` (or the reverse).
   - Replace the S3 `index.html` with a redirect page/canonical, then retire the bucket.
   - Verify Google Search Console (domain property), submit the sitemap, and update the Google Business Profile URL.
6. **Monitoring:** Vercel Analytics and Speed Insights, error tracking (Sentry), uptime checks, and alerts if an MLS sync fails.
7. **Backups and continuity:** Supabase daily backups and PITR; image originals kept in Storage; you own every account (domain, Vercel, Supabase, Google).

### 4.10 Implementation milestones

| # | Milestone | Deliverables | Est. |
|---|---|---|---|
| **M0** | Discovery & access (**start the IDX/VOW application now**) | Brokerage confirmation, PropTx/TRREB feed application, accounts (Vercel, Supabase, Resend, Google), logo vector, photos, agent bios, reviews | 1 wk (feed approval runs in parallel) |
| **M1** | Brand & design system | Moodboard, 2 homepage design directions, chosen direction, Tailwind tokens, core UI components, Figma-level page mockups for Home / Search / Listing / City / Sell | 1–2 wks |
| **M2** | Foundation | Next.js + TS + Tailwind setup, Supabase schema/migrations/RLS, auth, layout (header/footer/sticky bar), CI/CD, preview environment | 1 wk |
| **M3** | Marketing site + lead capture | Home, Sell, Buy, Invest, Rent, Team/Agent, Reviews, Contact/Book, Home Evaluation wizard, all forms → leads + email/SMS alerts, legal pages | 2 wks |
| **M4** | Admin dashboard v1 | Leads CRM pipeline, showings, own-listing manager, content editor (pages, communities, posts, testimonials), media library, roles | 2 wks |
| **M5** | Listings & search | Own/exclusive listings live; PropTx sync engine, search API, map+list search, listing detail, favourites, saved searches, alerts, VOW gating (needs feed approval) | 2–3 wks |
| **M6** | Local SEO content | City + neighbourhood pages, market stats + monthly reports, blog, structured data, sitemaps | 1–2 wks (content writing in parallel) |
| **M7** | QA & launch | Accessibility audit, performance tuning, cross-device QA, analytics/conversion events, DNS cut-over, Search Console, GBP update | 1 wk |
| **M8** | Post-launch growth | Instant AVM estimates, CMA PDF generator, review-request automation, A/B tests on CTAs, newsletter automation, multilingual pages if wanted | Ongoing |

**Total to launch:** about 10–13 weeks of build time. The MLS feed approval date drives M5. **If the feed is delayed, M1–M4 + M6 can launch first** (with your own listings and full lead capture), and IDX search is added as a fast-follow.

---

## Decisions needed before coding

1. **Brokerage of record:** name, logo usage rules, and each agent's registration title. Has the brokerage already applied for, or does it hold, a TRREB/PropTx IDX and/or VOW data licence?
2. **Listing data approach:** direct PropTx feed (recommended), or a third-party IDX provider to launch faster.
3. **Visual direction:** gold/champagne accent (luxury) or evolved teal (brand continuity).
4. **CRM:** do you use one today (Follow Up Boss, Lofty, kvCORE, other)? Or will the built-in admin CRM be the system of record?
5. **Content ownership:** who writes community pages and blog posts (you, me drafting for your review, or a copywriter)? Do you need any languages besides English?
6. **Account access:** domain registrar login (to remove forwarding), and creating Vercel, Supabase, Google Search Console and Business Profile accounts in your name.
7. **Assets:** original logo files, high-resolution headshots, photos of past listings, and existing Google reviews/testimonials.
8. **Budget for paid services:** MLS feed fees, map tiles, Twilio SMS, Supabase Pro, Vercel Pro (roughly $50–150 CAD/month total at launch volumes, excluding feed fees; to be confirmed).
