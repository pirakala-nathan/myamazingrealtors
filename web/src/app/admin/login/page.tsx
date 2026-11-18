import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 border border-cloud-300 bg-mist-50 p-8 md:p-10">
      <div className="flex flex-col gap-2">
        <p className="eyebrow text-aqua-700">Admin</p>
        <h1 className="font-display text-4xl font-semibold">Sign in</h1>
      </div>
      <LoginForm />
    </div>
  );
}
