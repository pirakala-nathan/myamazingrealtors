import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/content/home";
import { getListingsForAdmin } from "@/lib/listings/store";
import { listingTitle, statusLabel } from "@/lib/listings/types";
import { AddListingForm, RowActions } from "./listing-controls";

export const metadata: Metadata = { title: "Listings" };

async function Dashboard() {
  await requireAdmin();
  const listings = await getListingsForAdmin();
  const usingSample = !process.env.PROPTX_TOKEN;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="eyebrow text-aqua-700">Admin</p>
          <h1 className="font-display text-5xl font-semibold leading-none">Your listings</h1>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm font-bold underline">
            Sign out
          </button>
        </form>
      </div>

      {usingSample && (
        <p className="border-l-4 border-aqua-500 bg-aqua-100 px-4 py-3 text-sm">
          <strong>PropTx isn’t connected yet.</strong> In development, adding any MLS® number creates a sample listing so
          you can try the pages. Add <code>PROPTX_TOKEN</code> to pull real listings.
        </p>
      )}

      <section className="flex flex-col gap-4 border border-cloud-300 bg-mist-50 p-6 md:p-8">
        <h2 className="font-display text-3xl font-semibold">Add a listing</h2>
        <p className="text-body">
          Type the MLS® number. Photos, price and details are pulled from PropTx. Adding a number that’s already here
          refreshes it.
        </p>
        <AddListingForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-3xl font-semibold">On the site ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="text-muted">No listings yet.</p>
        ) : (
          <ul className="flex flex-col border-t border-cloud-300">
            {listings.map((l) => (
              <li key={l.mlsNumber} className="flex flex-col gap-3 border-b border-cloud-300 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 flex-col gap-0.5">
                  <Link href={`/listings/${l.slug}`} className="font-bold hover:text-aqua-700">
                    {listingTitle(l)}
                  </Link>
                  <span className="text-sm text-muted">
                    {l.mlsNumber} · {statusLabel[l.status]}
                    {l.status === "active" && l.listPrice ? ` · ${formatPrice(l.listPrice)}` : ""} · {l.photos.length}{" "}
                    photos · updated {new Date(l.fetchedAt).toLocaleDateString("en-CA")}
                    {l.source === "dev-sample" && " · SAMPLE"}
                  </span>
                </div>
                <RowActions mlsNumber={l.mlsNumber} title={listingTitle(l)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Dashboard />
    </Suspense>
  );
}
