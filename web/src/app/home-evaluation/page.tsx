import type { Metadata } from "next";
import { HomeEvaluationForm } from "@/components/forms/home-evaluation-form";
import { PageHeader } from "@/components/layout/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Home Evaluation",
  description: `What is your home worth? Get a free, personal home evaluation from ${site.agent.name}, Realtor®, based on recent sales in Pickering, Ajax, Whitby, Oshawa, Scarborough and Markham.`,
  alternates: { canonical: "/home-evaluation" },
};

const steps = [
  { title: "Tell PK about your home", body: "Address, type and anything that sets it apart. It takes about a minute." },
  {
    title: "PK reviews the market",
    body: "Recent sales, active competition and what buyers are paying on streets like yours.",
  },
  { title: "Get your price range", body: "A personal estimate from PK, not an automated number. No obligation." },
];

export default function HomeEvaluationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Free home evaluation"
        title={
          <>
            What’s your home worth<span className="text-champagne-700">?</span>
          </>
        }
      >
        <p>
          Online estimates miss what makes your home different. {site.agent.firstName} prepares a personal evaluation
          based on recent sales near you, free and with no obligation to list.
        </p>
      </PageHeader>

      <section className="container-site grid gap-10 pb-20 md:pb-26 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div className="border border-stone-300 bg-ivory-50 p-6 sm:p-8 md:p-10">
          <HomeEvaluationForm />
        </div>

        <aside className="flex flex-col gap-6 self-start bg-noir-900 p-8 text-on-dark-muted">
          <h2 className="font-display text-3xl font-semibold text-on-dark">How it works</h2>
          <ol className="flex flex-col">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 border-t border-noir-600 py-5">
                <span className="font-display text-3xl font-semibold leading-none text-champagne-400">{i + 1}</span>
                <span className="flex flex-col gap-1">
                  <span className="font-bold text-on-dark">{s.title}</span>
                  <span className="text-[15px] leading-relaxed">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="border-t border-noir-600 pt-5 text-[13px] leading-relaxed text-on-dark-subtle">
            This is a market evaluation by a Realtor®, not a formal appraisal.
          </p>
        </aside>
      </section>
    </>
  );
}
