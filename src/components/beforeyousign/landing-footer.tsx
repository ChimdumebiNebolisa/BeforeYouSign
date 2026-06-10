import { FIXED_REPORT_DISCLAIMER, LANDING_PRIVACY_PROCESSING } from "@/lib/public-copy";

const FOOTER_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingFooter() {
  return (
    <footer className="bys-section-gap border-t border-border/50 pb-10 pt-12 text-center lg:text-left">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="mx-auto max-w-[42rem] space-y-4 lg:mx-0">
          <div>
            <p className="font-[family-name:var(--font-headline)] text-lg font-bold text-primary">BeforeYouSign</p>
            <p className="mt-1 text-sm text-muted-foreground">Texas residential lease review for students and renters.</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_REPORT_DISCLAIMER}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{LANDING_PRIVACY_PROCESSING}</p>
        </div>
        <nav className="flex flex-col items-center gap-3 text-sm lg:min-w-[10rem] lg:items-start">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <p className="mt-8 text-center text-[11px] text-muted-foreground/80 lg:text-left">
        © {new Date().getFullYear()} BeforeYouSign.
      </p>
    </footer>
  );
}
