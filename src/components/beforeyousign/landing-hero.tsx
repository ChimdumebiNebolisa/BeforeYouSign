"use client";

import { LANDING_HEADLINE, LANDING_SUBHEADLINE } from "@/lib/public-copy";

type LandingHeroProps = {
  onReviewLease: () => void;
  onRunSample: () => void;
};

export function LandingHero({ onReviewLease, onRunSample }: LandingHeroProps) {
  return (
    <div className="bys-hero-content">
      <h1 className="bys-hero-headline">
        {LANDING_HEADLINE.replace(/before you sign\.$/, "")}
        <span className="text-primary">before you sign.</span>
      </h1>
      <p className="bys-hero-description">
        {LANDING_SUBHEADLINE}
      </p>
      <div className="bys-hero-actions">
        <button
          type="button"
          onClick={onReviewLease}
          className="h-11 rounded-lg bys-gradient-cta px-8 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Review a lease
        </button>
        <button
          type="button"
          onClick={onRunSample}
          className="h-11 rounded-lg border border-primary/25 bg-card px-8 text-sm font-semibold text-primary transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Run sample lease
        </button>
      </div>
      <p className="bys-hero-disclaimer">
        <span className="inline-flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-primary" aria-hidden>
            ⓘ
          </span>
          <span>Choose the property state before review. For education, not legal advice.</span>
        </span>
      </p>
    </div>
  );
}
