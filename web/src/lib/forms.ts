import { site } from "@/lib/site";

/** Shared between the forms (client) and the Server Functions that handle them. */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Submitted text values, returned on error so the form keeps what the visitor typed. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** CASL express-consent wording. Stored with each submission exactly as shown. */
export const CONSENT_TEXT = `Yes, email me market updates and new listings from ${site.agent.name}, ${site.brokerage.name}, Brokerage. I can unsubscribe at any time.`;

export const propertyTypes = ["Detached", "Semi-detached", "Townhouse", "Condo apartment", "Other"];

export const timelines = ["Within 3 months", "3 to 6 months", "6 to 12 months", "Just curious"];

export const contactTopics = ["Buying", "Selling", "Buying and selling", "Something else"];
