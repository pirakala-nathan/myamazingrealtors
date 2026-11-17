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
