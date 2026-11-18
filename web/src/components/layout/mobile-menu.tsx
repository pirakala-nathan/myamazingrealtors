"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mainNav, site } from "@/lib/site";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
    </svg>
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const buttonClass = "flex size-11 items-center justify-center rounded-full border-[1.5px] border-navy-900";

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className={buttonClass}
      >
        <MenuIcon open={false} />
      </button>
      {/* Portal to <body>: the header's backdrop-filter would otherwise trap this fixed overlay. */}
      {open &&
        createPortal(
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 overflow-y-auto bg-mist-100"
        >
          <div className="container-site flex items-center justify-between border-b border-cloud-300 py-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- small inline SVG logo */}
            <img src="/brand/logo-horizontal.svg" alt={site.name} className="h-8 w-auto" />
            <button ref={closeRef} type="button" aria-label="Close menu" onClick={close} className={buttonClass}>
              <MenuIcon open />
            </button>
          </div>
          <nav aria-label="Mobile" className="container-site flex flex-col py-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="border-b border-cloud-300 py-4 font-display text-3xl font-semibold"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-3 pb-10">
              <Link href="/contact" onClick={close} className="rounded-full bg-navy-900 py-4 text-center font-bold text-on-dark">
                Book a call with {site.agent.firstName}
              </Link>
              <a href={site.agent.phoneHref} className="rounded-full border-[1.5px] border-navy-900 py-4 text-center font-bold">
                Call {site.agent.phone}
              </a>
            </div>
          </nav>
        </div>,
          document.body,
        )}
    </div>
  );
}
