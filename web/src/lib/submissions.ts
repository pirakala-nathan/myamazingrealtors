import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

/**
 * The only visitor data the site keeps: contact messages, free home evaluation
 * requests and newsletter sign-ups. There is no CRM; each one is saved here and
 * emailed to PK.
 */
export type SubmissionKind = "contact" | "home-evaluation" | "newsletter";

export type Submission = {
  kind: SubmissionKind;
  name?: string;
  email: string;
  phone?: string;
  /** Contact only: buying, selling, etc. */
  topic?: string;
  message?: string;
  /** Home evaluation only. */
  property?: { address: string; city: string; propertyType?: string; timeline?: string };
  /** CASL: express consent to receive marketing email, with the wording shown at the time. */
  marketingConsent: { given: boolean; text: string };
  /** Page the form was submitted from. */
  sourcePath: string;
};

/** Collection name for each kind, so each form can be exported separately from the Firebase console. */
const collection: Record<SubmissionKind, string> = {
  contact: "contactMessages",
  "home-evaluation": "homeEvaluations",
  newsletter: "newsletterSignups",
};

export async function saveSubmission(submission: Submission) {
  const ref = await db()
    .collection(collection[submission.kind])
    .add({ ...submission, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}
