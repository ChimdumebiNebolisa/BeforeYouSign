const STICKY_NOTES = [
  "Finds rent, deposits, and hidden fees",
  "Shows the exact lease wording",
  "Helps you ask better questions",
  "Links supported-state renter resources",
] as const;

const PREVIEW_ITEMS = [
  { label: "Monthly rent", value: "$1,250" },
  { label: "Security deposit", value: "$1,250" },
  { label: "Late fee policy", value: "$75 after 5-day grace" },
  { label: "Maintenance responsibility", value: "Tenant: minor upkeep" },
  { label: "Question to ask", value: "When is the deposit returned after move-out?" },
  { label: "Lease quote", value: '"Tenant shall pay all utilities including water, gas, and electricity."' },
] as const;

export function LandingPreviewSection() {
  return (
    <section className="bys-section-gap">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-10 text-center lg:text-left">
          <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
            See what it finds
          </h2>
          <p className="mt-2 text-muted-foreground">
            A preview of the kind of summary you get after reviewing a residential lease.
          </p>
        </div>

        <div className="relative">
          <div className="bys-float-shadow rounded-2xl border border-border bg-card p-8 sm:p-10 lg:p-11">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Sample preview</p>
            <h3 className="mt-2 font-[family-name:var(--font-headline)] text-lg font-semibold text-foreground">
              Residential Lease Agreement
            </h3>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {PREVIEW_ITEMS.map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/60 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Terms to review</p>
              <p className="mt-1 text-sm text-foreground">
                &ldquo;Landlord may enter with 24 hours notice for repairs or inspections.&rdquo;
              </p>
            </div>
          </div>

          <div className="bys-sticky-note-yellow pointer-events-none absolute -right-[10.5rem] top-6 z-10 hidden w-52 rotate-2 rounded-md border border-foreground/10 py-3 pr-10 pl-4 text-[13px] font-medium leading-snug text-foreground xl:block">
            {STICKY_NOTES[0]}
          </div>
          <div className="bys-sticky-note-purple pointer-events-none absolute -left-[10.5rem] top-[34%] z-10 hidden w-52 -translate-y-1/2 -rotate-1 rounded-md border border-foreground/10 py-3 pr-4 pl-10 text-[13px] font-medium leading-snug text-foreground xl:block">
            {STICKY_NOTES[1]}
          </div>
          <div className="bys-sticky-note-blue pointer-events-none absolute -left-[10.5rem] bottom-24 z-10 hidden w-52 rotate-1 rounded-md border border-foreground/10 py-3 pr-4 pl-10 text-[13px] font-medium leading-snug text-foreground xl:block">
            {STICKY_NOTES[2]}
          </div>
          <div className="bys-sticky-note-yellow pointer-events-none absolute -right-[10.5rem] bottom-6 z-10 hidden w-52 -rotate-2 rounded-md border border-foreground/10 py-3 pr-10 pl-4 text-[13px] font-medium leading-snug text-foreground xl:block">
            {STICKY_NOTES[3]}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:hidden" aria-label="What the review highlights">
            {STICKY_NOTES.map((note, index) => (
              <div
                key={note}
                className={[
                  "rounded-lg border border-foreground/10 px-4 py-3 text-[13px] font-medium leading-snug text-foreground",
                  index === 1
                    ? "bys-sticky-note-purple"
                    : index === 2
                      ? "bys-sticky-note-blue"
                      : "bys-sticky-note-yellow",
                ].join(" ")}
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
