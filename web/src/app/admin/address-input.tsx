"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { lookupAddressDetails, lookupAddressSuggestions } from "@/app/actions/admin";

type Suggestion = { placeId: string; main: string; secondary: string };
export type PickedAddress = { street: string; city: string; postalCode: string | null };

const newSession = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

/**
 * Street address field with Google address suggestions. Typing shows matching addresses; picking one
 * fills the street (with unit) here and hands the city and postal code to the form via onPick.
 * Arrow keys + Enter work; Esc closes. Typing freely still works if nothing matches or Google is unavailable.
 */
export function AddressInput({
  defaultValue,
  className,
  onPick,
  inputProps,
}: {
  defaultValue: string;
  className: string;
  onPick: (address: PickedAddress) => void;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [filling, setFilling] = useState(false);
  const session = useRef(newSession());
  const timer = useRef(0);
  const latest = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const search = (text: string) => {
    window.clearTimeout(timer.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    // Wait for a pause in typing before asking Google.
    timer.current = window.setTimeout(async () => {
      const ticket = ++latest.current;
      const found = await lookupAddressSuggestions(text, session.current);
      if (ticket !== latest.current) return; // a newer search has started
      setSuggestions(found);
      setHighlight(-1);
      setOpen(found.length > 0);
    }, 250);
  };

  const pick = async (s: Suggestion) => {
    setOpen(false);
    setFilling(true);
    const parts = await lookupAddressDetails(s.placeId, session.current);
    setFilling(false);
    session.current = newSession(); // the next address is a new session
    if (!parts) {
      setValue(s.main);
      return;
    }
    setValue(parts.street);
    onPick(parts);
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        {...inputProps}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="m-street-suggestions"
        aria-activedescendant={open && highlight >= 0 ? `m-street-s${highlight}` : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
          } else if (e.key === "Enter" && highlight >= 0) {
            e.preventDefault();
            pick(suggestions[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={className}
      />
      {filling && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">Filling in…</span>}
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 border border-cloud-400 bg-white shadow-[0_18px_40px_-20px_rgba(10,29,40,0.5)]">
          <ul id="m-street-suggestions" role="listbox" aria-label="Matching addresses">
            {suggestions.map((s, i) => (
              <li key={s.placeId} id={`m-street-s${i}`} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onClick={() => pick(s)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full flex-col items-start px-4 py-2.5 text-left ${i === highlight ? "bg-mist-100" : ""}`}
                >
                  <span className="font-semibold text-ink">{s.main}</span>
                  <span className="text-xs text-muted">{s.secondary}</span>
                </button>
              </li>
            ))}
          </ul>
          {/* Google's terms ask for this credit when its suggestions are shown without a Google map. */}
          <p className="border-t border-cloud-300 px-4 py-1.5 text-right text-[11px] text-muted">Powered by Google</p>
        </div>
      )}
    </div>
  );
}
