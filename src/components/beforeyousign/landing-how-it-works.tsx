const STEPS = [
  {
    step: "1",
    title: "Upload or paste your lease",
    description: "Add a PDF, paste text, or run the sample lease.",
  },
  {
    step: "2",
    title: "Review key terms",
    description: "See costs, deadlines, responsibilities, and terms to review.",
  },
  {
    step: "3",
    title: "Ask better questions",
    description: "Use the questions to clarify the lease before signing.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="bys-section-gap scroll-mt-28">
      <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">
        How it works
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {STEPS.map((item) => (
          <div
            key={item.step}
            className="flex min-h-[160px] flex-col gap-3 rounded-2xl border border-border/40 bg-card p-7 shadow-[0_8px_24px_rgba(0,32,69,0.04)] lg:p-8"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {item.step}
            </span>
            <h3 className="font-[family-name:var(--font-headline)] text-lg font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
