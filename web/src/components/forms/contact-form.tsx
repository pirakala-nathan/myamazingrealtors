"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/actions/forms";
import { contactTopics, initialFormState } from "@/lib/forms";
import { site } from "@/lib/site";
import {
  ConsentCheckbox,
  ErrorBanner,
  Honeypot,
  PrivacyNote,
  SelectField,
  SubmitButton,
  SuccessPanel,
  TextArea,
  TextField,
} from "./fields";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessPanel title="Thank you. Your message is on its way.">
        <p>
          {site.agent.firstName} will get back to you personally. If it’s urgent, call or text{" "}
          <a href={site.agent.phoneHref} className="font-bold underline">
            {site.agent.phone}
          </a>
          .
        </p>
      </SuccessPanel>
    );
  }

  return (
    <form action={action} noValidate className="relative flex flex-col gap-5">
      <ErrorBanner state={state} />
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Name" autoComplete="name" required state={state} />
        <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" required state={state} />
        <TextField name="phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" state={state} />
        <SelectField name="topic" label="I’m interested in" options={contactTopics} state={state} />
      </div>
      <TextArea name="message" label="Message" required state={state} />
      <ConsentCheckbox state={state} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <SubmitButton pending={pending}>Send message</SubmitButton>
        <PrivacyNote />
      </div>
    </form>
  );
}
