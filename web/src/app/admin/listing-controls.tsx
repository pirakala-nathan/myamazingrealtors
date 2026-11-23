"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { addListing, refreshListing, removeListing, setOverAsking, showListing, syncListings, type AdminFormState } from "@/app/actions/admin";

const initial: AdminFormState = { status: "idle" };

export function AddListingForm() {
  const [state, action, pending] = useActionState(addListing, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="mlsNumber" className="text-sm font-bold">
        MLS® number
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="mlsNumber"
          name="mlsNumber"
          required
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="E12345678"
          className="flex-1 border border-cloud-400 bg-mist-50 px-4 py-3 text-base uppercase focus:border-navy-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-none bg-navy-900 px-8 font-bold text-on-dark hover:bg-navy-700 disabled:opacity-70"
        >
          {pending ? "Looking up…" : "Add listing"}
        </button>
      </div>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`text-sm font-semibold ${state.status === "error" ? "text-red-800" : "text-aqua-700"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

/** "Sync with MLS®": pulls in PK's new listings and updates changed ones. */
export function SyncListingsForm() {
  const [state, action, pending] = useActionState(syncListings, initial);
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-none bg-navy-900 px-8 font-bold text-on-dark hover:bg-navy-700 disabled:opacity-70"
      >
        {pending ? "Syncing…" : "Sync with MLS®"}
      </button>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`text-sm font-semibold ${state.status === "error" ? "text-red-800" : "text-aqua-700"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

/**
 * "Sold over asking" / "Leased over asking" switch for MLS®-added sales. PropTx doesn't include the sale price,
 * so PK marks it here (listings typed in by hand have the same tick box on their edit page).
 */
function OverAskingSwitch({ mlsNumber, sale, initial }: { mlsNumber: string; sale: "sold" | "leased"; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const label = sale === "leased" ? "Leased over asking" : "Sold over asking";
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={pending}
        onClick={() => {
          const next = !on;
          setOn(next);
          setError("");
          start(async () => {
            const res = await setOverAsking(mlsNumber, next);
            if (res.error) {
              setOn(!next);
              setError(res.error);
            }
          });
        }}
        className="inline-flex min-h-10 items-center gap-2.5 text-sm font-bold disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-aqua-500" : "bg-cloud-400"}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${
              on ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </span>
        {label}
      </button>
      {error && (
        <span role="alert" className="text-xs font-semibold text-red-800">
          {error}
        </span>
      )}
    </div>
  );
}

export function RowActions({
  mlsNumber,
  title,
  manual,
  sale = null,
  overAsking = false,
  hidden = false,
}: {
  mlsNumber: string;
  title: string;
  manual: boolean;
  /** Set for sold/leased listings, which can be marked over asking. */
  sale?: "sold" | "leased" | null;
  overAsking?: boolean;
  /** Hidden from the site by PK. */
  hidden?: boolean;
}) {
  const [pending, start] = useTransition();
  const button = "rounded-none border-[1.5px] border-navy-900 px-4 py-2 text-sm font-bold disabled:opacity-60";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!manual && sale && <OverAskingSwitch mlsNumber={mlsNumber} sale={sale} initial={overAsking} />}
      {manual ? (
        <Link href={`/admin/edit/${encodeURIComponent(mlsNumber)}`} className={button}>
          Edit
        </Link>
      ) : (
        <button type="button" disabled={pending} className={button} onClick={() => start(() => refreshListing(mlsNumber))}>
          {pending ? "Working…" : "Refresh"}
        </button>
      )}
      {hidden ? (
        <button type="button" disabled={pending} className={button} onClick={() => start(() => showListing(mlsNumber))}>
          Show on site
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          className={`${button} border-red-800 text-red-800`}
          onClick={() => {
            const ask = manual
              ? `Remove ${title} from the website? You can add it again later.`
              : `Hide ${title} from the website? Syncing won’t bring it back; use “Show on site” to undo.`;
            if (confirm(ask)) start(() => removeListing(mlsNumber));
          }}
        >
          {manual ? "Remove" : "Hide"}
        </button>
      )}
    </div>
  );
}
