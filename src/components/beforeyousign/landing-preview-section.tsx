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
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-10 text-center lg:text-left">
          <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
            See what it finds
          </h2>
          <p className="mt-2 text-muted-foreground">
            A preview of the kind of summary you get after reviewing a residential lease.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_14rem]">
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1" aria-label="What the review highlights">
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
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-primary/75">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
