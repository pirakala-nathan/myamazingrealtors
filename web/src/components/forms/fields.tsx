import Link from "next/link";
import type { ReactNode } from "react";
import { CONSENT_TEXT, type FormState } from "@/lib/forms";
import { site } from "@/lib/site";

const control =
  "w-full rounded-none border border-cloud-400 bg-mist-50 px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-navy-900 focus:outline-none focus-visible:outline-2 aria-[invalid=true]:border-red-700";

type FieldProps = {
  name: string;
  label: string;
  state: FormState;
  required?: boolean;
  hint?: string;
  className?: string;
};

function Wrapper({ name, label, state, required, hint, className = "", children }: FieldProps & { children: ReactNode }) {
  const error = state.fieldErrors?.[name]?.[0];
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-sm font-bold">
        {label}
        {required ? <span className="text-aqua-700"> *</span> : <span className="font-medium text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-[13px] font-semibold text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

function aria(name: string, state: FormState, hint?: string) {
  const error = state.fieldErrors?.[name]?.[0];
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : hint ? `${name}-hint` : undefined,
  } as const;
}

export function TextField({
  type = "text",
  autoComplete,
  inputMode,
  ...props
}: FieldProps & {
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
}) {
  const { name, state, required, hint } = props;
  return (
    <Wrapper {...props}>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={state.values?.[name] ?? ""}
        className={control}
        {...aria(name, state, hint)}
      />
    </Wrapper>
  );
}

export function TextArea(props: FieldProps & { rows?: number }) {
  const { name, state, required, hint, rows = 5 } = props;
  return (
    <Wrapper {...props}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={state.values?.[name] ?? ""}
        className={`${control} resize-y`}
        {...aria(name, state, hint)}
      />
    </Wrapper>
  );
}

export function SelectField(props: FieldProps & { options: readonly string[]; placeholder?: string }) {
  const { name, state, required, hint, options, placeholder = "Choose one" } = props;
  return (
    <Wrapper {...props}>
      <div className="relative">
        <select
          id={name}
          name={name}
          required={required}
          defaultValue={state.values?.[name] ?? ""}
          className={`${control} appearance-none pr-10`}
          {...aria(name, state, hint)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </Wrapper>
  );
}

/** CASL express consent: optional and unchecked by default. */
export function ConsentCheckbox({ state }: { state: FormState }) {
  return (
    <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
      <input
        type="checkbox"
        name="marketingConsent"
        defaultChecked={false}
        key={state.status}
        className="mt-1 size-5 shrink-0 accent-navy-900"
      />
      <span>{CONSENT_TEXT}</span>
    </label>
  );
}

/** Hidden from people and screen readers; bots tend to fill it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-13 w-full items-center justify-center rounded-none bg-navy-900 px-8 py-4 text-base font-bold text-on-dark transition-colors hover:bg-navy-700 hover:text-aqua-300 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      {pending ? "Sending…" : children}
    </button>
  );
}

export function PrivacyNote() {
  return (
    <p className="text-[13px] leading-relaxed text-muted">
      Your details are used to reply to you (and, only if you opt in, to send updates) and are never sold. See the{" "}
      <Link href="/privacy" className="font-semibold underline">
        privacy policy
      </Link>
      .
    </p>
  );
}

export function ErrorBanner({ state }: { state: FormState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <p role="alert" className="border-l-4 border-red-800 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
      {state.message}
    </p>
  );
}

export function SuccessPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-4 border border-cloud-300 bg-mist-50 p-8 md:p-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-navy-900 text-aqua-400" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </span>
      <h2 className="font-display text-4xl font-semibold leading-tight">{title}</h2>
      <div className="leading-relaxed text-body">{children}</div>
    </div>
  );
}
