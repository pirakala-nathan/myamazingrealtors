import "server-only";
import type { Submission } from "@/lib/submissions";
import { site } from "@/lib/site";

const subjects: Record<Submission["kind"], string> = {
  contact: "New contact message",
  "home-evaluation": "New home evaluation request",
  newsletter: "New newsletter sign-up",
};

function body(s: Submission) {
  const lines = [
    `Name: ${s.name ?? "-"}`,
    `Email: ${s.email}`,
    `Phone: ${s.phone ?? "-"}`,
    s.topic && `Interested in: ${s.topic}`,
    s.property && `Property: ${s.property.address}, ${s.property.city}`,
    s.property?.propertyType && `Type: ${s.property.propertyType}`,
    s.property?.timeline && `Timeline: ${s.property.timeline}`,
    s.message && `\n${s.message}\n`,
    `Marketing email consent: ${s.marketingConsent.given ? "yes" : "no"}`,
    `Sent from: ${site.url}${s.sourcePath}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Emails a submission to PK through Resend's HTTP API. Skipped (returns false)
 * until RESEND_API_KEY and RESEND_FROM are set; the submission is still saved.
 * NOTIFY_TO overrides the recipient (comma-separated), e.g. while testing with
 * Resend's onboarding@resend.dev sender, which only delivers to the Resend account's own email.
 */
export async function notifyPk(s: Submission) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.warn("[notify] Email alert skipped: set RESEND_API_KEY and RESEND_FROM to email PK about submissions.");
    return false;
  }
  const to = (process.env.NOTIFY_TO ?? site.agent.email)
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: s.email,
      subject: `${subjects[s.kind]}${s.name ? ` from ${s.name}` : ""}`,
      text: body(s),
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return true;
}
