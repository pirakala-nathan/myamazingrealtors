"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { addListing, refreshListing, removeListing, type AdminFormState } from "@/app/actions/admin";

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

export function RowActions({ mlsNumber, title, manual }: { mlsNumber: string; title: string; manual: boolean }) {
  const [pending, start] = useTransition();
  const button = "rounded-none border-[1.5px] border-navy-900 px-4 py-2 text-sm font-bold disabled:opacity-60";
  return (
    <div className="flex gap-2">
      {manual ? (
        <Link href={`/admin/edit/${encodeURIComponent(mlsNumber)}`} className={button}>
          Edit
        </Link>
      ) : (
        <button type="button" disabled={pending} className={button} onClick={() => start(() => refreshListing(mlsNumber))}>
          {pending ? "Working…" : "Refresh"}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        className={`${button} border-red-800 text-red-800`}
        onClick={() => {
          if (confirm(`Remove ${title} from the website? You can add it again later.`)) start(() => removeListing(mlsNumber));
        }}
      >
        Remove
      </button>
    </div>
  );
}
