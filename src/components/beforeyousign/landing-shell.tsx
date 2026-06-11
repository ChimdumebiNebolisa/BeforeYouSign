import { ReactNode } from "react";
import { LandingNav } from "@/components/beforeyousign/landing-nav";

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bys-hero-gradient" aria-hidden />
      <div
        className="pointer-events-none absolute top-40 -left-20 h-96 w-96 rounded-full bg-accent/40 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-32 h-96 w-96 rounded-full bg-muted/50 blur-[100px]"
        aria-hidden
      />

      <LandingNav />

      <main className="relative z-0 pt-24 pb-16 lg:pt-24">{children}</main>
    </div>
  );
}
