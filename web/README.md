# My Amazing Realtors — website

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Firebase (Firestore) · Netlify.

Planning documents are in `../docs/`:
- `01-audit-and-architecture-plan.md`
- `02-design-system.md`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Firebase keys when ready (the homepage runs without them)
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production (also type-checks) |
| `npm run lint` | Run ESLint |
| `npm run icons` | Regenerate favicons and app icons from `public/brand/logo-mark.svg` |

## Project layout

```
src/app/              routes (layout, homepage, sitemap, robots, manifest, 404)
src/components/       ui/, layout/, home/, seo/
src/lib/site.ts       site-wide facts (Realtor, office, brokerage, nav)
src/lib/content/      page content; [BRACKETED] values are placeholders to replace before launch
src/lib/firebase/     Firebase Admin (server only)
src/lib/submissions.ts saves contact, home evaluation and newsletter forms
firebase/             Firestore and Storage security rules
public/brand/         logo SVGs
public/images/        listing and team photos
```

## What the site stores

Scope is deliberately small. There is no CRM and no visitor accounts.

| Firestore collection | Written by |
|---|---|
| `contactMessages` | Contact form |
| `homeEvaluations` | Free home evaluation form |
| `newsletterSignups` | Newsletter sign-up (until an email platform is connected) |
| `listings` | PK, from the admin page: by MLS® number once PropTx access is approved, or typed in by hand |

Access rules:
- Browsers have no direct Firestore access (`firebase/firestore.rules` denies everything).
- The server reads and writes with the Admin SDK, using the service-account variables in `.env.example`.
- Listing photos in Storage under `listings/` are publicly readable; nothing else is.

Deploy the rules with the Firebase CLI from this folder: `firebase deploy --only firestore:rules,storage`.

## Email alerts for form submissions

Every form submission is saved in Firestore. Emailing PK about it needs [Resend](https://resend.com):
- `RESEND_API_KEY`: an API key from Resend.
- `RESEND_FROM`: the sender, on a domain verified in Resend (e.g. `My Amazing Realtors <forms@myamazingrealtors.com>`). To test before the domain is verified, use `My Amazing Realtors <onboarding@resend.dev>`; Resend then delivers only to the email address the Resend account was created with.
- `NOTIFY_TO` (optional): who receives the alerts, comma-separated. Defaults to PK's site email.

Without the first two, submissions are still saved and the function log shows "Email alert skipped".

## Google rating and reviews

`src/lib/google-reviews.ts` pulls PK's Google rating, review count and up to 5 reviews (Google's "most relevant") from the Places API (New), refreshed about every 6 hours. The homepage shows the rating in the hero and results band, and 3 reviews in "What clients say" with the author's name, photo and a link to each review on Google Maps, as Google's policies require. Reviews are never saved to the database.

Set `GOOGLE_PLACES_API_KEY` (a server-only key restricted to "Places API (New)"). PK's Business Profile place ID is `site.googlePlaceId` in `src/lib/site.ts`; `GOOGLE_PLACE_ID` overrides it. Without the key, the placeholders show. The reviews scroll sideways in a carousel (`src/components/home/review-carousel.tsx`) that advances every few seconds and pauses on hover, focus or touch.

## Reels ("Watch PK")

PK manages up to 6 reels on `/admin`: upload each reel's video file (any phone video; files over 25 MB are compressed in the browser to 720p H.264 MP4 at about 3 Mbps with Mediabunny, `src/app/admin/compress-video.ts`), add a title and optionally the Instagram link. Videos are uploaded in 3 MB pieces through the server to Firebase Storage under `reels/` (`src/lib/videos.ts`), and a still frame is captured in the browser as the preview image. The homepage carousel (`src/components/home/reel-carousel.tsx`) plays the middle reel silently, moves on when it ends, and opens a full-screen player with sound on click. Instagram embeds aren't used because they can't be styled.

## Opening animation

`src/components/layout/intro.tsx` shows a black screen where the logo's hands form the roof, the windows light up and a loading bar fills, then it fades into the site (about 3 seconds). It plays once per browser session, never on `/admin`, and not for visitors who ask their device for reduced motion. Add `?intro` to any URL to replay it. The timing is in the "Intro" block at the end of `src/app/globals.css`.

## Admin: listings added by hand

Until PropTx is connected (or for a listing outside the feed), PK can use **Add a listing by hand** on `/admin`: address, city, MLS® number, status, price, details, description and photos.
- Up to 6 photos per listing (`MAX_MANUAL_PHOTOS`); older listings with more are trimmed to their first 6 automatically when read, and saved that way on the next edit. Photos are resized in the browser to 2000px and uploaded one at a time to Firebase Storage under `listings/` (`FIREBASE_STORAGE_BUCKET`, e.g. `my-project.firebasestorage.app`). In local development without Firebase they go to `public/uploads/` (git-ignored). The first photo is the cover.
- Hand-entered listings show **Edit** instead of Refresh, so PropTx never overwrites them.
- Sold and leased listings with photos replace the sample sales in the homepage "Recently sold" section (newest 4). The "Sold over asking" badge is a checkbox on the form. Sold prices are never shown.
- Removing a listing or a photo leaves the photo file in Storage.

## Admin: adding listings

Go to `/admin` and sign in with `ADMIN_PASSWORD` (PK only; no accounts are stored). Type an MLS® number and the site pulls the price, details and photos from PropTx (`src/lib/listings/proptx.ts`) and publishes it at `/listings/<address-slug>` and on `/our-listings`.
- **Refresh** re-pulls a listing (for example after a price change or once it sells). A listing no longer in the feed is kept but marked off market.
- **Remove** takes it off the site.
- Sold prices are never shown publicly. Sellers' "don't display online" and "hide address" flags are respected.
- PK's PropTx agreement covers **the brokerage's listings** only.
- Without `PROPTX_TOKEN`, development adds a labelled sample listing instead, and local data is kept in `.data/listings.json` until Firebase is connected.
- Field names other than `ListingKey`, `ListPrice`, `StandardStatus`, `City` and the Media fields come from the RESO Data Dictionary and should be checked against `https://query.ampre.ca/odata/$metadata` with the real token.

## Deploying to Netlify

Import the repository and set **Base directory** to `web`. `netlify.toml` sets the build command and Node version, and Netlify applies its Next.js runtime automatically. Add the variables from `.env.example` in the Netlify UI. Search engines are blocked (robots.txt plus a `noindex` tag on every page) unless `ALLOW_INDEXING=true` is set. Leave it unset on the `*.netlify.app` test site and set it only on the live site at launch, then redeploy.

## This Next.js version

Next.js 16 changes several APIs. Before using an unfamiliar API, read the bundled docs in `node_modules/next/dist/docs/` (see `AGENTS.md`). Examples:
- `preload` replaces `priority` on `next/image`
- `images.qualities` is required
- Cache Components uses `"use cache"` together with `<Suspense>`

If a Netlify deploy shows problems with Cache Components or partial prefetching, turn off `cacheComponents` and `partialPrefetching` in `next.config.ts`.
