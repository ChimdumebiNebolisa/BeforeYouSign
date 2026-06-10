"use client";

import { LANDING_HEADLINE, LANDING_SUBHEADLINE } from "@/lib/public-copy";

type LandingHeroProps = {
  onReviewLease: () => void;
  onRunSample: () => void;
};

export function LandingHero({ onReviewLease, onRunSample }: LandingHeroProps) {
  return (
    <div className="space-y-6 text-center lg:text-left">
      <h1 className="mx-auto max-w-[560px] font-[family-name:var(--font-headline)] text-4xl font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:mx-0 lg:text-[3.5rem] xl:text-6xl">
        {LANDING_HEADLINE.replace(/before you sign\.$/, "")}
        <span className="text-primary">before you sign.</span>
      </h1>
      <p className="mx-auto max-w-[540px] text-[17px] leading-[1.55] text-muted-foreground lg:mx-0 lg:text-lg">
        {LANDING_SUBHEADLINE}
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:items-start lg:justify-start">
        <button
          type="button"
          onClick={onReviewLease}
          className="h-11 rounded-full bys-gradient-cta px-8 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Review a lease
        </button>
        <button
          type="button"
          onClick={onRunSample}
          className="h-11 rounded-full border border-primary/25 bg-card px-8 text-sm font-semibold text-primary transition hover:bg-muted"
        >
          Run sample lease
        </button>
      </div>
      <p className="mx-auto max-w-[560px] text-sm leading-relaxed text-muted-foreground lg:mx-0">
        <span className="inline-flex items-start gap-2 text-left">
          <span className="mt-0.5 shrink-0 text-primary" aria-hidden>
            ⓘ
          </span>
          <span>Texas leases only. For education, not legal advice.</span>
        </span>
      </p>
    </div>
  );
}
