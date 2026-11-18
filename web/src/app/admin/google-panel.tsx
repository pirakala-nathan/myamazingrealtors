import { disconnectGoogle } from "@/app/actions/admin";
import { getConnection, oauthConfigured } from "@/lib/google-business";

const results: Record<string, { tone: "ok" | "error"; text: string }> = {
  connected: { tone: "ok", text: "Connected. Your newest Google reviews will show on the homepage within a minute or two." },
  "connected-unmatched": {
    tone: "ok",
    text: "Connected, but the business found doesn’t match the site’s Google place ID. Check the name below is your profile.",
  },
  cancelled: { tone: "error", text: "Google sign-in was cancelled. Nothing changed." },
  "not-configured": { tone: "error", text: "Google sign-in isn’t set up yet: add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET." },
  "error-state": { tone: "error", text: "That sign-in link expired. Please click Connect Google again." },
  "error-no-refresh-token": { tone: "error", text: "Google didn’t return a long-term token. Remove the app’s access in your Google Account, then connect again." },
  "error-access": {
    tone: "error",
    text: "Google refused access to the Business Profile API. Your API access request may not be approved yet (quota 0), or the APIs aren’t enabled.",
  },
  error: { tone: "error", text: "Connecting to Google didn’t work. Details are in the Netlify function logs ([google])." },
};

/** Admin panel: connect PK's Google Business Profile so the homepage shows the newest reviews. */
export async function GoogleReviewsPanel({ result }: { result?: string }) {
  const configured = oauthConfigured();
  const connection = configured ? await getConnection() : null;
  const message = result ? results[result] : undefined;

  return (
    <section className="flex flex-col gap-4 border border-cloud-300 bg-mist-50 p-6 md:p-8">
      <h2 className="font-display text-3xl font-semibold">Google reviews</h2>
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`text-sm font-semibold ${message.tone === "error" ? "text-red-800" : "text-aqua-700"}`}
        >
          {message.text}
        </p>
      )}
      {connection ? (
        <>
          <p className="text-body">
            Showing your newest reviews from <strong>{connection.title}</strong>. Connected{" "}
            {new Date(connection.connectedAt).toLocaleDateString("en-CA")}.
          </p>
          <form action={disconnectGoogle}>
            <button type="submit" className="border-[1.5px] border-red-800 px-4 py-2 text-sm font-bold text-red-800">
              Disconnect
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-body">
            Right now the homepage shows the 5 reviews Google picks as “most relevant”. Connect your Google Business
            Profile to always show your newest reviews first. Sign in with the Google account that manages the profile.
          </p>
          {configured ? (
            // A plain link: this starts a redirect to Google, so it must not be prefetched.
            <a
              href="/admin/google/connect"
              className="inline-flex min-h-12 items-center self-start bg-navy-900 px-6 font-bold text-on-dark hover:bg-navy-700"
            >
              Connect Google
            </a>
          ) : (
            <p className="text-sm text-muted">
              Not set up yet: Google needs to approve Business Profile API access, then add GOOGLE_OAUTH_CLIENT_ID and
              GOOGLE_OAUTH_CLIENT_SECRET in Netlify (see docs/04-google-reviews-setup.md).
            </p>
          )}
        </>
      )}
    </section>
  );
}
