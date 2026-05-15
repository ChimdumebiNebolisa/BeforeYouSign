import Image from "next/image";
import { ReactNode } from "react";

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f9fb]">
      <div className="pointer-events-none absolute inset-0 bys-hero-gradient" aria-hidden />
      <div
        className="pointer-events-none absolute top-40 -left-20 h-96 w-96 rounded-full bg-[#dbe1ff]/40 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-32 h-96 w-96 rounded-full bg-[#d3e4fe]/35 blur-[100px]"
        aria-hidden
      />

      <header className="fixed top-4 left-1/2 z-50 w-full max-w-7xl -translate-x-1/2 px-4">
        <nav className="bys-glass-panel bys-float-shadow flex h-[4.75rem] items-center justify-between rounded-2xl px-5 sm:h-20 sm:px-6">
          <span className="relative block h-11 max-w-full shrink-0 sm:h-[3.25rem] w-[min(100%,320px)] sm:w-[min(100%,420px)] flex items-center">
            <span
              className="text-lg font-extrabold tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 hover:scale-105 transition-transform duration-150"
              aria-label="BeforeYouSign"
            >
              beforeyousign
            </span>
          </span>
          <p className="hidden text-[13px] font-medium text-[#757682] sm:block">Lease analysis</p>
        </nav>
      </header>

      <main className="relative z-0 pt-28 pb-16">{children}</main>
    </div>
  );
}
