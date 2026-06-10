import {
  TEXAS_RENTER_CHECK_EXAMPLES,
  TEXAS_RENTER_CHECK_PREVIEW,
  TEXAS_RENTER_CHECK_SAFETY,
  TEXAS_RENTER_CHECK_SOURCE_NOTE_LANDING,
} from "@/lib/public-copy";

const TOPICS = ["Deposits", "Repairs", "Late fees", "Lockouts", "Utilities", "Landlord entry"] as const;

export function LandingTexasRenterPreview() {
  return (
    <section id="texas-renter-check" className="bys-section-gap scroll-mt-28">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-muted/80 to-card p-8 sm:p-10">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
          Texas renter check
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{TEXAS_RENTER_CHECK_PREVIEW}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-primary/20 bg-card px-4 py-1.5 text-xs font-medium text-primary"
            >
              {topic}
            </span>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {TEXAS_RENTER_CHECK_EXAMPLES.map((example) => (
            <li key={example} className="flex gap-2">
              <span className="text-primary" aria-hidden>
                •
              </span>
              {example}
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <span className="mt-0.5 shrink-0 text-primary" aria-hidden>
            ⓘ
          </span>
          {TEXAS_RENTER_CHECK_SAFETY}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{TEXAS_RENTER_CHECK_SOURCE_NOTE_LANDING}</p>
      </div>
    </section>
  );
}
