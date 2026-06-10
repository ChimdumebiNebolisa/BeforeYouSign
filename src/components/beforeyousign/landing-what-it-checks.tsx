const TOPICS = [
  "Rent and deposits",
  "Late fees",
  "Renewal and move-out notice",
  "Repairs and maintenance",
  "Utilities",
  "Landlord entry",
  "Guest and pet rules",
  "Missing or unclear terms",
] as const;

export function LandingWhatItChecks() {
  return (
    <section id="what-it-checks" className="bys-section-gap scroll-mt-28">
      <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
        What it checks
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        BeforeYouSign highlights common residential lease topics worth a closer look.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOPICS.map((topic) => (
          <div
            key={topic}
            className="flex min-h-[72px] items-center rounded-2xl border border-border/50 bg-card px-5 py-4 shadow-sm transition hover:shadow-md lg:py-5"
          >
            <p className="text-sm font-semibold text-foreground">{topic}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
