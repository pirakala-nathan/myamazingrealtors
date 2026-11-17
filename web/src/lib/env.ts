import "server-only";
import { z } from "zod";

/**
 * Server-only environment variables, validated lazily so the marketing pages can
 * build before Firebase is connected. Reading a missing value throws a clear error.
 */
const required = (name: string) => {
  const parsed = z.string().min(1).safeParse(process.env[name]);
  if (!parsed.success) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return parsed.data;
};

/** True once the Firebase service-account variables are set. */
export const firebaseConfigured = () =>
  Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

export const serverEnv = {
  get firebaseProjectId() {
    return required("FIREBASE_PROJECT_ID");
  },
  get firebaseClientEmail() {
    return required("FIREBASE_CLIENT_EMAIL");
  },
  /** Hosting dashboards store newlines as literal "\n"; turn them back into real ones. */
  get firebasePrivateKey() {
    return required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
  },
};
