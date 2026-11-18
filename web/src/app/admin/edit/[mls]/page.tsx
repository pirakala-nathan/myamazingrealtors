import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { findListing } from "@/lib/listings/store";
import { listingTitle } from "@/lib/listings/types";
import { site } from "@/lib/site";
import { ManualListingForm } from "../../manual-listing-form";

export const metadata: Metadata = { title: "Edit listing" };

async function Editor({ params }: { params: PageProps<"/admin/edit/[mls]">["params"] }) {
  await requireAdmin();
  const { mls } = await params;
  const listing = await findListing(decodeURIComponent(mls));
  if (!listing) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-sm font-bold underline">
          ← Back to your listings
        </Link>
        <h1 className="font-display text-5xl font-semibold leading-none">{listingTitle(listing)}</h1>
        {listing.source !== "manual" && (
          <p className="text-sm text-muted">
            This listing came from PropTx. Saving here turns it into a hand-entered listing, so Refresh will no longer
            update it.
          </p>
        )}
      </div>
      <section className="border border-cloud-300 bg-mist-50 p-6 md:p-8">
        <ManualListingForm listing={listing} cities={site.serviceAreas} />
      </section>
    </div>
  );
}

export default function EditListingPage({ params }: PageProps<"/admin/edit/[mls]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}
