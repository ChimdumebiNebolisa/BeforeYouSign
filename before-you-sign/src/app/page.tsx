import { LandingShell } from "@/components/beforeyousign/landing-shell";

export default function Home() {
  return (
    <LandingShell>
      <div className="flex flex-col flex-1 items-center justify-center font-sans">
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between rounded-3xl border border-slate-200/60 bg-white/60 px-8 py-12 backdrop-blur shadow-sm sm:items-start">
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Understand your lease before you sign
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Looking for a starting point or more instructions? Head over to{" "}
              <a
                href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                className="font-medium text-zinc-950 dark:text-zinc-50"
              >
                Templates
              </a>{" "}
              or the{" "}
              <a
                href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                className="font-medium text-zinc-950 dark:text-zinc-50"
              >
                Learning
              </a>{" "}
              center.
            </p>
          </div>
        </main>
      </div>
    </LandingShell>
  );
}
