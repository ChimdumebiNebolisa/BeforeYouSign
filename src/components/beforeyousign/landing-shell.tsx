import { ReactNode } from "react";
import { BackgroundBeams } from "@/components/beforeyousign/background-beams";

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundBeams />
      <header className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <nav className="flex items-center gap-2.5 rounded-full border border-border/90 bg-card/85 px-5 py-2.5 shadow-sm shadow-slate-900/5 backdrop-blur-md">
          <span
            className="inline-block size-2 rounded-full bg-primary"
            aria-hidden="true"
          />
          <div className="text-sm font-semibold tracking-tight text-foreground">BeforeYouSign</div>
        </nav>
      </header>
      <main className="relative z-0 pt-24">{children}</main>
    </div>
  );
}

