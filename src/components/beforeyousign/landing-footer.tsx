import { FIXED_REPORT_DISCLAIMER, PRIVACY_BLOCK } from "@/lib/public-copy";

export function LandingFooter() {
  return (
    <footer className="bys-section-gap border-t border-border/50 pb-8 pt-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-headline)] text-lg font-bold text-primary">BeforeYouSign</p>
          <p className="mt-1 text-sm text-muted-foreground">Texas residential lease review for students and renters.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm">
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">
            How it works
          </a>
          <a href="#what-it-checks" className="text-muted-foreground hover:text-foreground">
            What it checks
          </a>
          <a href="#texas-renter-check" className="text-muted-foreground hover:text-foreground">
            Texas renter check
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">
            FAQ
          </a>
        </nav>
      </div>
      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{FIXED_REPORT_DISCLAIMER}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{PRIVACY_BLOCK}</p>
      <p className="mt-6 text-[11px] text-muted-foreground/80">
        © {new Date().getFullYear()} BeforeYouSign. Educational only, not legal advice.
      </p>
    </footer>
  );
}
