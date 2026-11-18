# Google reviews: newest first (Business Profile API)

The homepage shows Google reviews in two ways:

| Setup | What shows |
|---|---|
| **Places API** (`GOOGLE_PLACES_API_KEY` only) | The 5 reviews Google picks as "most relevant", sorted newest first. Google offers no "newest" option here, so your latest review may be missing. |
| **Business Profile API** (this guide) | Your newest reviews first, always. Up to 10 with text, plus your overall rating and review count. |

When the Business Profile is connected, the site uses it. If it ever fails, the site falls back to the Places API automatically.

## 1. Request API access from Google (can take days to weeks)

Google only grants access if the Business Profile has been **verified and active for 60+ days** and lists a website.

1. In https://console.cloud.google.com, open the same project you used for the Places API.
2. Copy the **Project number** from the Project info card on the Dashboard.
3. Fill in Google's form at https://support.google.com/business/contact/api_default and choose **"Application for Basic API Access"**.
   - Use an email address that is an owner or manager of the Business Profile.
   - Paste the project number.
4. Wait for Google's email. To check yourself, in Cloud Console go to **APIs & Services → Quotas** for the Business Profile APIs: **0** requests per minute means not approved yet; **300** means approved.

## 2. Turn on the APIs (after approval)

In **APIs & Services → Library**, enable:
- **Google My Business API** (this is the one with reviews; it only appears once you're approved)
- **My Business Account Management API**
- **My Business Business Information API**

## 3. Create the sign-in credentials

1. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: "My Amazing Realtors website". Support email: yours.
   - Scopes: add `https://www.googleapis.com/auth/business.manage`.
   - Under **Publishing status**, click **Publish app** so it's "In production". (In "Testing" mode Google expires the connection every 7 days.)
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs**, add both:
     - `https://myamazingrealtors.netlify.app/admin/google/callback`
     - `http://localhost:3000/admin/google/callback`
     - Later, at launch, also `https://www.myamazingrealtors.com/admin/google/callback`.
3. Copy the **Client ID** and **Client secret**.

## 4. Add them to Netlify

| Variable | Value |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | the Client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | the Client secret (mark as secret) |

Redeploy. Don't paste these into chat.

## 5. Connect, once

1. Go to `/admin` on the site and sign in.
2. In **Google reviews**, click **Connect Google**.
3. Sign in with the Google account that manages the Business Profile and allow access. Because the app isn't verified by Google, you may see "Google hasn't verified this app": click **Advanced → Go to My Amazing Realtors website**. It's your own app.
4. You're sent back to `/admin` with "Connected". The homepage updates within a minute or two.

The connection is saved on the server (Firestore `settings/googleBusiness`, which browsers can't read). Reviews refresh about every 6 hours. **Disconnect** on `/admin` removes it.

## If something goes wrong

The admin page shows a message, and details are in Netlify **Logs → Functions** under `[google]` or `[google-reviews]`.
- "Google refused access": not approved yet (quota 0) or the APIs in step 2 aren't enabled.
- "didn't return a long-term token": remove the app at https://myaccount.google.com/permissions, then connect again.
- `redirect_uri_mismatch` on Google's page: the address in step 3 doesn't exactly match the site's address.
