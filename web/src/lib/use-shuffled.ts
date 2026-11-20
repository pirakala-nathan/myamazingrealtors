"use client";

import { useSyncExternalStore } from "react";

const shuffled = new WeakMap<readonly unknown[], unknown[]>();
const noSubscribe = () => () => {};

/** Fisher–Yates shuffle into a new array. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The items in a fresh random order on every visit. The server (and hydration) use the original order so the
 * HTML always matches; the browser swaps in the shuffle straight after. Each array is shuffled once, so the
 * order stays put while the visitor is on the page.
 */
export function useShuffled<T>(items: readonly T[]): readonly T[] {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      let order = shuffled.get(items);
      if (!order) shuffled.set(items, (order = shuffle(items)));
      return order as T[];
    },
    () => items,
  );
}
