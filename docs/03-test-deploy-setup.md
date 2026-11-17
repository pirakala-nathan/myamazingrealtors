# Test deploy: GitHub, Firebase and Netlify setup

This is the checklist for putting the site on a private `*.netlify.app` test address. Search engines stay blocked the whole time. Don't change the myamazingrealtors.com domain yet.

## 1. GitHub (about 5 minutes)

1. Sign in at https://github.com and create a **new private repository**, for example `my-amazing-realtors`. Leave README, .gitignore and licence unticked; the project already has them.
2. In a terminal in the project folder (`My Amazing Realtors`), run the two commands GitHub shows under "push an existing repository":
   ```bash
   git remote add origin https://github.com/<your-account>/my-amazing-realtors.git
   git push -u origin main
   ```

## 2. Firebase (about 10 minutes)

1. Go to https://console.firebase.google.com and click **Create a project**. Name it something like `my-amazing-realtors`. Google Analytics is optional; you can switch it off.
2. **Firestore Database** → **Create database**:
   - Location: **northamerica-northeast2 (Toronto)**, so visitor data stays in Canada. The location can't be changed later.
   - Start in **production mode**.
3. Firestore → **Rules** tab: replace the rules with the contents of `web/firebase/firestore.rules` (they block all browser access) and click **Publish**.
4. **Project settings** (gear icon) → **Service accounts** → **Generate new private key**. A `.json` file downloads. Keep it private: don't email it or paste it in chat. The next step needs three values from it:
   - `project_id`
   - `client_email`
   - `private_key`

Photo storage (Firebase Storage) isn't needed yet, because listing photos come from PropTx.

## 3. Netlify (about 10 minutes)

1. Sign up at https://app.netlify.com using **Sign up with GitHub**.
2. **Add new site** → **Import an existing project** → GitHub → pick the repository.
3. Build settings:
   - **Base directory:** `web`
   - Leave the build command and publish directory as Netlify fills them in; `web/netlify.toml` sets them.
4. Before deploying, open **Environment variables** and add the following. Mark the secret ones as "Contains secret values".

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The test address Netlify gives you, e.g. `https://my-amazing-realtors.netlify.app` (you can set it after the first deploy and redeploy) |
| `FIREBASE_PROJECT_ID` | `project_id` from the key file |
| `FIREBASE_CLIENT_EMAIL` | `client_email` from the key file |
| `FIREBASE_PRIVATE_KEY` | `private_key` from the key file, copied exactly, including `-----BEGIN PRIVATE KEY-----` and the `\n` characters |
| `ADMIN_PASSWORD` | A long password PK will use at `/admin` |
| `ADMIN_SESSION_SECRET` | A random string of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `PROPTX_TOKEN` | The token from https://syndication.ampre.ca/tokens ("Show Token" shows it once) |

Do **not** add `ALLOW_INDEXING` yet. Leaving it out keeps Google away from the test site.

5. Click **Deploy**. The first build takes a few minutes.

## 4. Check the test site

- **Home, Contact, Free Home Evaluation:** load each page and send one test form each. The submissions should appear in Firestore under `contactMessages` and `homeEvaluations`.
- **Admin:** go to `/admin`, sign in, and add one of PK's current MLS® numbers. It should appear on `/our-listings` with photos.
- **Search engines blocked:** `/robots.txt` should say `Disallow: /`.

If something fails, the error is in Netlify under **Deploys** (build problems) or **Logs → Functions** (form and admin problems).

## Not covered by the test deploy

- **Email alerts to PK:** need a Resend account and a verified sending domain (`RESEND_API_KEY`, `RESEND_FROM`).
- **Missing pages:** About PK, Buy, Sell, Communities, Insights, Search, Market Report, Privacy, Terms and Accessibility.
- **Placeholder content:** everything in `[brackets]` still needs real text.
- **Launch:** the domain switch and `ALLOW_INDEXING=true` come last.
