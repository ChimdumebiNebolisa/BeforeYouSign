import { LANDING_PRIVACY_PROCESSING } from "@/lib/public-copy";

const FOOTER_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingFooter() {
  return (
    <footer className="bys-landing-container bys-landing-footer">
      <div className="bys-footer-main">
        <div className="max-w-[42rem] space-y-2">
          <div>
            <p className="font-[family-name:var(--font-headline)] text-base font-bold text-foreground">BeforeYouSign</p>
            <p className="mt-2 text-xs text-muted-foreground">Residential lease review for students and renters.</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">Understand the wording. Prepare your questions. For education, not legal advice.</p>
          <details className="bys-footer-privacy">
            <summary>Privacy &amp; processing</summary>
            <p>{LANDING_PRIVACY_PROCESSING}</p>
          </details>
        </div>
        <nav className="bys-footer-links" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <p className="mt-6 text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} BeforeYouSign.
      </p>
    </footer>
  );
}
