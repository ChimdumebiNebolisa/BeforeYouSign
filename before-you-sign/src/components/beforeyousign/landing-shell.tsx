import { ReactNode } from "react";

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <header className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <nav className="flex items-center justify-between gap-6 rounded-full border border-slate-200/60 bg-white/60 px-6 py-2.5 backdrop-blur">
          <div className="text-sm font-medium text-slate-900">BeforeYouSign</div>
          <div className="h-6 w-1" aria-hidden="true" />
        </nav>
      </header>
      <main className="relative z-0 pt-24">{children}</main>
    </div>
  );
}

