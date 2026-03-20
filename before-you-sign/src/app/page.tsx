import { LandingShell } from "@/components/beforeyousign/landing-shell";

export default function Home() {
  return (
    <LandingShell>
      <div className="flex flex-col flex-1 items-center justify-center font-sans">
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-start rounded-3xl border border-slate-200/60 bg-white/60 px-5 py-10 backdrop-blur shadow-sm sm:px-8 sm:py-12 sm:items-start">
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Understand your lease before you sign
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Upload or paste your lease text to understand key terms before you sign.
            </p>
          </div>
        </main>
      </div>
    </LandingShell>
  );
}
