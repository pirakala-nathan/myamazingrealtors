import { stats as baseStats } from "@/lib/content/home";
import { formatRating, getGoogleReviews } from "@/lib/google-reviews";
import { StatCards } from "@/components/home/stat-cards";

export async function ResultsBand() {
  const google = await getGoogleReviews();
  const stats = baseStats.map((s) =>
    s.label === "Google rating" && google
      ? { ...s, value: formatRating(google.rating), detail: `From ${google.count} Google reviews` }
      : s,
  );
  return (
    <section className="bg-navy-800 text-on-dark">
      <div className="container-site flex flex-col gap-11 py-20 md:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 className="font-display text-[clamp(2.75rem,5.4vw,4.75rem)] font-semibold leading-[0.95]">
            Results,
            <br />
            <span className="text-aqua-400">not promises.</span>
          </h2>
          <p className="max-w-[460px] text-[17px] leading-relaxed text-on-dark-muted">
            Every listing gets a pricing strategy, professional photography and video, and a negotiator who treats your
            home like their own.
          </p>
        </div>
        <StatCards stats={stats} />
      </div>
    </section>
  );
}
