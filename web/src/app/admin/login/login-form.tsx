"use client";

import { useActionState } from "react";
import { login, type AdminFormState } from "@/app/actions/admin";

const initial: AdminFormState = { status: "idle" };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.status === "error" && (
        <p role="alert" className="border-l-4 border-red-800 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
          {state.message}
        </p>
      )}
      <label htmlFor="password" className="text-sm font-bold">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="border border-stone-400 bg-ivory-50 px-4 py-3 text-base focus:border-noir-900 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-noir-900 px-6 font-bold text-on-dark hover:bg-noir-700 disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
