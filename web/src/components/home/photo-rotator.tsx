"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type RotatorPhoto = { src: string; alt: string; href: string | null };

const SWAP_MS = 3500; // one slot changes every 3.5s, so each photo stays up about 10s
const isRemote = (src: string) => /^https?:\/\//.test(src);

/** One grid cell: cross-fades to a new photo whenever `photo` changes, with a slow zoom. */
function Slot({ photo, sizes, className }: { photo: RotatorPhoto; sizes: string; className: string }) {
  // Keep the outgoing photo underneath while the new one fades in.
  const [layers, setLayers] = useState<{ current: RotatorPhoto; previous: RotatorPhoto | null }>({
    current: photo,
    previous: null,
  });
  if (layers.current.src !== photo.src) setLayers({ current: photo, previous: layers.current });

  const body = (
    <>
      {layers.previous && (
        <Image
          key={`prev-${layers.previous.src}`}
          src={layers.previous.src}
          alt=""
          fill
          sizes={sizes}
          unoptimized={isRemote(layers.previous.src)}
          className="object-cover"
        />
      )}
      <Image
        key={layers.current.src}
        src={layers.current.src}
        alt={layers.current.alt}
        fill
        sizes={sizes}
        unoptimized={isRemote(layers.current.src)}
        className={`object-cover ${layers.previous ? "photo-fade-in" : ""} photo-drift`}
      />
    </>
  );

  return (
    <div className={`relative overflow-hidden bg-cloud-300 ${className}`}>
      {layers.current.href ? (
        <Link href={layers.current.href} className="absolute inset-0" aria-label={layers.current.alt}>
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

/**
 * The three-photo grid beside the homepage search. With more than three photos it
 * rotates through them, changing one cell at a time, newest listings first.
 * Stops rotating for visitors who prefer reduced motion and while the tab is hidden.
 */
export function PhotoRotator({ photos }: { photos: RotatorPhoto[] }) {
  const [state, setState] = useState({ slots: [0, 1, 2], next: 3, tick: 0 });

  useEffect(() => {
    if (photos.length <= 3) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setState((s) => {
        const slot = s.tick % 3;
        const slots = [...s.slots];
        slots[slot] = s.next % photos.length;
        return { slots, next: (s.next + 1) % photos.length, tick: s.tick + 1 };
      });
    }, SWAP_MS);
    return () => window.clearInterval(id);
  }, [photos.length]);

  const at = (slot: number) => photos[state.slots[slot] % photos.length];

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4">
      <Slot photo={at(0)} sizes="(min-width: 1024px) 25vw, 50vw" className="row-span-2 min-h-[300px]" />
      <Slot photo={at(1)} sizes="(min-width: 1024px) 25vw, 50vw" className="min-h-[142px]" />
      <Slot photo={at(2)} sizes="(min-width: 1024px) 25vw, 50vw" className="min-h-[142px]" />
    </div>
  );
}
