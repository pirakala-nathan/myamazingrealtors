"use server";

import { z } from "zod";
import { firebaseConfigured } from "@/lib/env";
import { notifyPk } from "@/lib/notify";
import type { Submission } from "@/lib/submissions";
import { site } from "@/lib/site";
import { CONSENT_TEXT, type FormState } from "@/lib/forms";

const optional = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v || undefined);

const person = {
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.email("Please enter a valid email address.").trim().max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Please enter a 10-digit phone number, or leave it blank.")
    .transform((v) => v || undefined),
};

const contactSchema = z.object({
  ...person,
  topic: optional,
  message: z.string().trim().min(5, "Please add a short message.").max(4000),
});

const evaluationSchema = z.object({
  ...person,
  address: z.string().trim().min(5, "Please enter the property address.").max(200),
  city: z.string().trim().min(2, "Please choose a city.").max(80),
  propertyType: optional,
  timeline: optional,
  message: z.string().trim().max(4000).transform((v) => v || undefined),
});

/** Reads text fields only, so values can be sent back to refill the form after an error. */
function textValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !k.startsWith("$ACTION")) values[k] = v;
  return values;
}

async function store(submission: Submission, values: Record<string, string>): Promise<FormState> {
  try {
    if (firebaseConfigured()) {
      // Loaded only when needed: the Firebase SDK is large and isn't required for validation errors.
      const { saveSubmission } = await import("@/lib/submissions");
      await saveSubmission(submission);
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("Firebase is not configured");
    } else {
      console.info("[forms] Firebase not configured; submission not saved (dev only):", submission.kind);
    }
  } catch (error) {
    console.error("[forms] could not save submission", error);
    return {
      status: "error",
      message: `Sorry, something went wrong sending your message. Please call or text ${site.agent.firstName} at ${site.agent.phone}.`,
      values,
    };
  }
  // Email is a convenience; the submission is already saved, so never fail the visitor on it.
  await notifyPk(submission).catch((error) => console.error("[forms] email notification failed", error));
  return { status: "success" };
}

function invalid(error: z.ZodError, values: Record<string, string>): FormState {
  return {
    status: "error",
    message: "Please check the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    values,
  };
}

/** Bots fill the hidden "website" field; humans never see it. Pretend success so they move on. */
const isBot = (formData: FormData) => Boolean(formData.get("website"));

const consent = (formData: FormData) => ({ given: formData.get("marketingConsent") === "on", text: CONSENT_TEXT });

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success" };
  const values = textValues(formData);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  const { name, email, phone, topic, message } = parsed.data;
  return store(
    { kind: "contact", name, email, phone, topic, message, marketingConsent: consent(formData), sourcePath: "/contact" },
    values,
  );
}

export async function submitHomeEvaluation(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success" };
  const values = textValues(formData);
  const parsed = evaluationSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  const { name, email, phone, address, city, propertyType, timeline, message } = parsed.data;
  return store(
    {
      kind: "home-evaluation",
      name,
      email,
      phone,
      message,
      property: { address, city, propertyType, timeline },
      marketingConsent: consent(formData),
      sourcePath: "/home-evaluation",
    },
    values,
  );
}
