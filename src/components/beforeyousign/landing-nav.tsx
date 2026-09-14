import Link from "next/link";

export function LandingNav() {
  return (
    <header className="fixed top-4 left-1/2 z-50 w-full max-w-[var(--bys-container-max)] -translate-x-1/2 px-6 lg:px-8">
      <nav className="bys-glass-panel bys-float-shadow flex h-14 items-center justify-between rounded-2xl px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-headline)] text-base font-extrabold tracking-tight text-primary sm:text-lg"
        >
          BeforeYouSign
        </Link>
        <Link
          href="/call-agent"
          className="rounded-xl bg-[#191c1e] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85 sm:px-4 sm:text-sm"
        >
          Call leasing office
        </Link>
      </nav>
    </header>
  );
}
