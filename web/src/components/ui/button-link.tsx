import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "accent" | "outline-light";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-none px-6 py-3.5 text-base font-bold transition-colors";

const variants: Record<Variant, string> = {
  // ink/mist-100 = navy with light text in the light theme, inverted (light with dark text) in the dark theme.
  primary: "bg-ink text-mist-100 hover:bg-navy-700 hover:text-aqua-300",
  secondary: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-mist-100",
  accent: "bg-aqua-400 font-extrabold text-navy-900 hover:bg-aqua-300",
  "outline-light": "border-[1.5px] border-on-dark text-on-dark hover:bg-on-dark hover:text-navy-900",
};

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
