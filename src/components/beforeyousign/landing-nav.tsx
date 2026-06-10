"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { TEXAS_LEASES_ONLY_BADGE } from "@/lib/public-copy";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#what-it-checks", label: "What it checks" },
  { href: "#texas-renter-check", label: "Texas renter check" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToIntake = () => {
    setMobileOpen(false);
    document.getElementById("review-intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed top-4 left-1/2 z-50 w-full max-w-[var(--bys-container-max)] -translate-x-1/2 px-4">
      <nav className="bys-glass-panel bys-float-shadow flex items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-6 sm:py-4">
        <a
          href="#"
          className="shrink-0 font-[family-name:var(--font-headline)] text-base font-extrabold tracking-tight text-primary sm:text-lg"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          BeforeYouSign
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary sm:inline-block">
            {TEXAS_LEASES_ONLY_BADGE}
          </span>
          <button
            type="button"
            onClick={scrollToIntake}
            className="hidden h-10 items-center justify-center rounded-full bys-gradient-cta px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:inline-flex"
          >
            Review a lease
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="bys-glass-panel bys-float-shadow mt-2 rounded-2xl border border-border/50 p-4 md:hidden">
          <div className="mb-3">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary">
              {TEXAS_LEASES_ONLY_BADGE}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={scrollToIntake}
              className="mt-2 h-11 rounded-full bys-gradient-cta text-sm font-semibold text-white"
            >
              Review a lease
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
