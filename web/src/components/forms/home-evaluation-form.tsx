"use client";

import { useActionState } from "react";
import { submitHomeEvaluation } from "@/app/actions/forms";
import { initialFormState, propertyTypes, timelines } from "@/lib/forms";
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

const cities = [...site.serviceAreas, "Other (GTA)"];

function Legend({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <legend className="mb-5 flex items-baseline gap-3 font-display text-[28px] font-semibold leading-tight">
      <span className="text-base font-sans font-extrabold text-champagne-700">{step}</span>
      {children}
    </legend>
  );
}

export function HomeEvaluationForm() {
  const [state, action, pending] = useActionState(submitHomeEvaluation, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessPanel title="Request received.">
        <p>
          {site.agent.firstName} will look at recent sales near your home and be in touch to confirm a few details before
          sending your estimate. Questions in the meantime? Call or text{" "}
          <a href={site.agent.phoneHref} className="font-bold underline">
            {site.agent.phone}
          </a>
          .
        </p>
      </SuccessPanel>
    );
  }

  return (
    <form action={action} noValidate className="relative flex flex-col gap-10">
      <ErrorBanner state={state} />
      <Honeypot />

      <fieldset>
        <Legend step="01">Your home</Legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="address"
            label="Street address"
            autoComplete="street-address"
            required
            state={state}
            className="sm:col-span-2"
          />
          <SelectField name="city" label="City" options={cities} required state={state} />
          <SelectField name="propertyType" label="Property type" options={propertyTypes} state={state} />
          <SelectField name="timeline" label="When might you sell?" options={timelines} state={state} />
        </div>
        <div className="mt-5">
          <TextArea
            name="message"
            label="Anything PK should know?"
            hint="Renovations, finished basement, upgrades, lot size and so on."
            rows={4}
            state={state}
          />
        </div>
      </fieldset>

      <fieldset>
        <Legend step="02">Where to send it</Legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Name" autoComplete="name" required state={state} />
          <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" required state={state} />
          <TextField name="phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" state={state} />
        </div>
      </fieldset>

      <ConsentCheckbox state={state} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <SubmitButton pending={pending}>Get my home’s value</SubmitButton>
        <PrivacyNote />
      </div>
    </form>
  );
}
