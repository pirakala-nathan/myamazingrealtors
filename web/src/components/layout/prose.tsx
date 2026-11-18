import type { ReactNode } from "react";

/** Long-form text (policies, service pages): readable line length and spacing. */
export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`max-w-3xl text-[17px] leading-relaxed text-body [&_a]:font-semibold [&_a]:text-aqua-700 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-[32px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-extrabold [&_h3]:text-ink [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-ink [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 ${className}`}
    >
      {children}
    </div>
  );
}
