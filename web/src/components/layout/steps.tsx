/** Numbered "how it works" steps for service pages. */
export function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-px border border-cloud-300 bg-cloud-300 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="flex flex-col gap-3 bg-mist-50 p-7">
          <span className="font-display text-4xl font-semibold leading-none text-aqua-700">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="text-lg font-extrabold">{s.title}</h3>
          <p className="text-[15px] leading-relaxed text-body">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
