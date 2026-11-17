import type { ReactNode } from "react";

/** Standard top-of-page title block for inner pages. */
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-site flex flex-col gap-5 pb-10 pt-14 md:pb-14 md:pt-20">
      <p className="eyebrow text-champagne-700">{eyebrow}</p>
      <h1 className="max-w-4xl font-display text-[clamp(2.75rem,6vw,5.5rem)] font-semibold leading-[0.95]">{title}</h1>
      {children && <div className="max-w-2xl text-lg leading-relaxed text-body">{children}</div>}
    </header>
  );
}
