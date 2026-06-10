"use client";

import { LANDING_HEADLINE, LANDING_SUBHEADLINE, LANDING_SUPPORT_NOTE } from "@/lib/public-copy";

type LandingHeroProps = {
  onReviewLease: () => void;
  onRunSample: () => void;
};

export function LandingHero({ onReviewLease, onRunSample }: LandingHeroProps) {
  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-headline)] text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3rem]">
        {LANDING_HEADLINE.replace(/before you sign\.$/, "")}
        <span className="text-primary">before you sign.</span>
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{LANDING_SUBHEADLINE}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onReviewLease}
          className="h-12 rounded-full bys-gradient-cta px-8 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Review a lease
        </button>
        <button
          type="button"
          onClick={onRunSample}
          className="h-12 rounded-full border border-primary/25 bg-card px-8 text-sm font-semibold text-primary transition hover:bg-muted"
        >
          Run sample lease
        </button>
      </div>
      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <span className="mt-0.5 shrink-0 text-primary" aria-hidden>
          ⓘ
        </span>
        {LANDING_SUPPORT_NOTE}
      </p>
    </div>
  );
}
