"use client";

import { useActionState, useState } from "react";
import { saveFeaturedReels, type AdminFormState } from "@/app/actions/admin";

const initial: AdminFormState = { status: "idle" };
const input =
  "min-w-0 flex-1 rounded-none border border-cloud-400 bg-white px-4 py-3 text-base text-ink focus:border-navy-900 focus:outline-none";
const small = "min-w-9 border border-navy-900 px-2 py-2 text-sm font-bold disabled:opacity-30";

/** Ordered list of reel links; the first shows first on the homepage. */
export function ReelsForm({ initialLinks, max }: { initialLinks: string[]; max: number }) {
  const [rows, setRows] = useState<{ id: number; value: string }[]>(
    (initialLinks.length ? initialLinks : [""]).map((value, id) => ({ id, value })),
  );
  const [nextId, setNextId] = useState(initialLinks.length + 1);
  const [state, action, pending] = useActionState(saveFeaturedReels, initial);

  const move = (from: number, to: number) =>
    setRows((r) => {
      if (to < 0 || to >= r.length) return r;
      const next = [...r];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });

  return (
    <form action={action} className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={row.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <label htmlFor={`reel-${row.id}`} className="w-6 text-sm font-bold text-muted">
              {i + 1}
            </label>
            <input
              id={`reel-${row.id}`}
              name="reel"
              value={row.value}
              onChange={(e) => setRows((r) => r.map((x) => (x.id === row.id ? { ...x, value: e.target.value } : x)))}
              placeholder="https://www.instagram.com/reel/…"
              inputMode="url"
              className={input}
            />
            <button type="button" className={small} disabled={i === 0} aria-label={`Move reel ${i + 1} up`} onClick={() => move(i, i - 1)}>
              ↑
            </button>
            <button
              type="button"
              className={small}
              disabled={i === rows.length - 1}
              aria-label={`Move reel ${i + 1} down`}
              onClick={() => move(i, i + 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className={`${small} border-red-800 text-red-800`}
              aria-label={`Remove reel ${i + 1}`}
              onClick={() => setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== row.id) : [{ ...r[0], value: "" }]))}
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={rows.length >= max}
          className="min-h-12 border-[1.5px] border-navy-900 px-6 font-bold disabled:opacity-40"
          onClick={() => {
            setRows((r) => [...r, { id: nextId, value: "" }]);
            setNextId((n) => n + 1);
          }}
        >
          {rows.length >= max ? `${max} reels (maximum)` : "Add another reel"}
        </button>
        <button type="submit" disabled={pending} className="min-h-12 bg-navy-900 px-8 font-bold text-on-dark hover:bg-navy-700 disabled:opacity-70">
          {pending ? "Saving…" : "Save reels"}
        </button>
        {state.message && (
          <p role={state.status === "error" ? "alert" : "status"} className={`text-sm font-semibold ${state.status === "error" ? "text-red-800" : "text-aqua-700"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
