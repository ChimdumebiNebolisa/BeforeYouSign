"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type CallResult = {
  callId: string | null;
  status: string | null;
  taskCompleted: boolean | null;
  summary: string | null;
  structuredResult: unknown;
  evidence: unknown[];
  recipients: unknown[];
};

const DEFAULT_QUESTIONS = [
  "Which move-in fees are mandatory, and which of those fees are refundable?",
  "Does this lease auto-renew, and exactly how much notice is required to opt out?",
  "Who is responsible for utilities, routine maintenance, and related charges?",
  "Are there any recurring charges or renter obligations not included in the listed monthly rent?",
];

function resultText(value: unknown): string {
  if (value === null || value === undefined) return "No structured result yet.";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function CallAgentClient() {
  const [phone, setPhone] = useState("");
  const [questionsText, setQuestionsText] = useState(DEFAULT_QUESTIONS.join("\n"));
  const [confirmed, setConfirmed] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CallResult | null>(null);

  const questions = questionsText
    .split("\n")
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, 8);

  const startCall = async () => {
    setError(null);
    setResult(null);
    setIsCalling(true);
    try {
      const response = await fetch("/api/call-landlord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, questions, confirmed }),
      });
      const data = (await response.json()) as CallResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to start the CALL-E phone task.");
      }
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start the CALL-E phone task.");
    } finally {
      setIsCalling(false);
    }
  };

  const checkResult = async () => {
    if (!result?.callId) return;
    setError(null);
    setIsChecking(true);
    try {
      const response = await fetch(`/api/call-landlord?callId=${encodeURIComponent(result.callId)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as CallResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to read the CALL-E result.");
      }
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read the CALL-E result.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 font-sans">
      <main className="bys-float-shadow rounded-[2rem] bg-white p-5 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757682]">CALL-E integration</p>
            <h1 className="mt-1 font-[family-name:var(--font-headline)] text-3xl font-extrabold tracking-tight text-[#191c1e]">
              Resolve lease questions by phone
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5c5e68]">
              BeforeYouSign can turn unresolved lease questions into a real CALL-E phone task. The agent identifies itself as an automated assistant, asks only factual clarification questions, and returns the call outcome for review.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-xl border border-[#c5c5d3]/35 bg-[#f2f4f6] px-4 py-2 text-sm font-semibold text-[#191c1e] hover:bg-[#eceef0]"
          >
            Analyze a lease
          </Link>
        </div>

        <section className="mt-8 grid gap-6 rounded-2xl border border-[#c5c5d3]/30 bg-[#f8fafb] p-5 sm:p-6">
          <label className="grid gap-2 text-sm font-semibold text-[#27292f]">
            Leasing office phone number
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+19035551234"
              inputMode="tel"
              className="h-11 rounded-xl border border-[#c5c5d3]/60 bg-white px-3 font-normal outline-none ring-primary/20 focus:ring-2"
            />
            <span className="text-xs font-normal text-[#757682]">Use international E.164 format, including the + and country code.</span>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#27292f]">
            Questions to ask
            <textarea
              value={questionsText}
              onChange={(event) => setQuestionsText(event.target.value)}
              rows={8}
              className="rounded-xl border border-[#c5c5d3]/60 bg-white p-3 font-normal leading-relaxed outline-none ring-primary/20 focus:ring-2"
            />
            <span className="text-xs font-normal text-[#757682]">One question per line. Up to eight questions are sent to CALL-E.</span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[#d7d9df] bg-white p-4 text-sm leading-relaxed text-[#444651]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              I want BeforeYouSign to place a real outbound phone call to this number and I am authorized to request this call. I understand the agent will ask factual lease questions only and will not negotiate or provide legal advice.
            </span>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="h-11 rounded-xl bys-gradient-cta px-6 text-white"
              onClick={() => void startCall()}
              disabled={isCalling || !confirmed || !phone.trim() || questions.length === 0}
            >
              {isCalling ? "Starting call..." : "Call the leasing office"}
            </Button>
            <p className="text-xs text-[#757682]">This action can cause an actual phone to ring.</p>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-xl border border-[#fecaca] bg-[#fff1f2] p-4 text-sm text-[#991b1b]">{error}</div>
        ) : null}

        {result ? (
          <section className="mt-6 rounded-2xl border border-[#c5c5d3]/30 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757682]">CALL-E result</p>
                <h2 className="mt-1 text-xl font-bold text-[#191c1e]">{result.status || "Call task created"}</h2>
                {result.callId ? <p className="mt-1 text-xs text-[#757682]">Call ID: {result.callId}</p> : null}
              </div>
              {result.callId ? (
                <Button
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => void checkResult()}
                  disabled={isChecking}
                >
                  {isChecking ? "Checking..." : "Check latest result"}
                </Button>
              ) : null}
            </div>

            {result.summary ? (
              <div className="mt-5 rounded-xl bg-[#f5f7f9] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#757682]">Summary</p>
                <p className="mt-2 text-sm leading-relaxed text-[#27292f]">{result.summary}</p>
              </div>
            ) : null}

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#757682]">Structured outcome</p>
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[#191c1e] p-4 text-xs leading-relaxed text-white">
                {resultText(result.structuredResult)}
              </pre>
            </div>
          </section>
        ) : null}

        <p className="mt-6 text-xs leading-relaxed text-[#757682]">
          BeforeYouSign is informational and does not provide legal advice. Verify important lease terms directly with the property manager and the written lease before signing.
        </p>
      </main>
    </div>
  );
}
