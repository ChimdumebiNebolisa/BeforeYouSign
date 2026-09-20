import { ReactNode } from "react";
import { LandingNav } from "@/components/beforeyousign/landing-nav";

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <div className="pointer-events-none absolute inset-0 bys-hero-gradient" aria-hidden />

      <LandingNav />

      <main className="relative z-0 pt-24 pb-16 lg:pt-24">{children}</main>
    </div>
  );
}
