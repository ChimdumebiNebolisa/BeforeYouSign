const STICKY_NOTES = [
  "Finds rent, deposits, and hidden fees",
  "Shows the exact lease wording",
  "Helps you ask better questions",
  "Links lease terms to Texas renter resources",
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
      <div className="mb-10 text-center sm:text-left">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
          See what it finds
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A preview of the kind of summary you get after reviewing a Texas residential lease.
        </p>
      </div>

      <div className="relative mx-auto max-w-[920px] overflow-hidden">
        <div className="rounded-3xl border border-[#e2e8f0] bg-card p-8 shadow-[0_24px_48px_rgba(0,32,69,0.12)] sm:p-10 lg:p-11">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Sample preview</p>
          <h3 className="mt-2 font-[family-name:var(--font-headline)] text-lg font-semibold text-foreground">
            Texas Residential Lease Agreement
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

        <div className="bys-sticky-note-yellow absolute -right-2 top-6 hidden w-[10.5rem] max-w-[11.875rem] rotate-2 rounded-md px-3 py-2.5 text-[13px] leading-snug text-[#0b1c30] sm:block lg:-right-10">
          {STICKY_NOTES[0]}
        </div>
        <div className="bys-sticky-note-purple absolute -left-2 top-1/3 hidden w-max max-w-none -rotate-1 whitespace-nowrap rounded-md px-3 py-2.5 text-[13px] leading-snug text-[#0b1c30] sm:block lg:-left-10">
          {STICKY_NOTES[1]}
        </div>
        <div className="bys-sticky-note-blue absolute -left-1 bottom-24 hidden w-[10.5rem] max-w-[11.875rem] rotate-1 rounded-md px-3 py-2.5 text-[13px] leading-snug text-[#0b1c30] sm:block lg:-left-8">
          {STICKY_NOTES[2]}
        </div>
        <div className="bys-sticky-note-yellow absolute -right-3 bottom-6 hidden w-[10.5rem] max-w-[11.875rem] -rotate-2 rounded-md px-3 py-2.5 text-[13px] leading-snug text-[#0b1c30] sm:block lg:-right-8">
          {STICKY_NOTES[3]}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground sm:text-left">
        Texas renter check notes cover statewide topics like deposits, repairs, and landlord entry.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-3 sm:hidden">
        {STICKY_NOTES.map((note) => (
          <span
            key={note}
            className="bys-sticky-note-yellow inline-block max-w-[11rem] rounded-md px-3 py-1.5 text-xs font-medium text-[#0b1c30]"
          >
            {note}
          </span>
        ))}
      </div>
    </section>
  );
}
