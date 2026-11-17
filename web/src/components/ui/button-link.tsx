import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "accent" | "outline-light";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold transition-colors";

const variants: Record<Variant, string> = {
  primary: "bg-noir-900 text-on-dark hover:bg-noir-700 hover:text-champagne-300",
  secondary: "border-[1.5px] border-noir-900 text-ink hover:bg-noir-900 hover:text-on-dark",
  accent: "bg-champagne-400 font-extrabold text-noir-900 hover:bg-champagne-300",
  "outline-light": "border-[1.5px] border-on-dark text-on-dark hover:bg-on-dark hover:text-noir-900",
};

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
