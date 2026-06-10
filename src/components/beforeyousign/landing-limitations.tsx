import { LANDING_LIMITATIONS } from "@/lib/public-copy";

export function LandingLimitations() {
  return (
    <section className="bys-section-gap">
      <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
        What it does not do
      </h2>
      <div className="mt-6 rounded-2xl border border-border/40 bg-muted/30 p-6 lg:p-8">
        <ul className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3 sm:space-y-0">
          {LANDING_LIMITATIONS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
