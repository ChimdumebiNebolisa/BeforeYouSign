import { LANDING_LIMITATIONS } from "@/lib/public-copy";

export function LandingLimitations() {
  return (
    <section className="bys-section-gap">
      <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
        What it does not do
      </h2>
      <ul className="mt-6 space-y-3">
        {LANDING_LIMITATIONS.map((item) => (
          <li key={item} className="flex items-start gap-3 text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
