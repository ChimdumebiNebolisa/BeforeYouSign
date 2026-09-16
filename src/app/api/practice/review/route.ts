import { NextRequest, NextResponse } from "next/server";
import { practiceAccess, DEFAULT_REVIEW_MODEL } from "@/lib/practice/config";
import { parseAgendaSnapshot } from "@/lib/practice/contracts";
import { buildPracticeReviewPrompt, parsePracticeReview } from "@/lib/practice/review";
import type { PracticeTurn } from "@/lib/practice/session";

function objectBody(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null;
  try {
    body = objectBody(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  const agenda = body ? parseAgendaSnapshot(body.agenda) : null;
  const turns = body?.turns;
  if (!agenda || !Array.isArray(turns) || turns.length > 100 || turns.some((turn) => !turn || typeof turn !== "object" || Array.isArray(turn) || typeof (turn as Record<string, unknown>).id !== "string" || (((turn as Record<string, unknown>).speaker !== "renter") && ((turn as Record<string, unknown>).speaker !== "role_play_representative")) || typeof (turn as Record<string, unknown>).text !== "string" || typeof (turn as Record<string, unknown>).final !== "boolean")) {
    return NextResponse.json({ error: "A valid agenda and bounded practice transcript are required." }, { status: 400 });
  }
  const practiceTurns = turns as PracticeTurn[];
  const access = practiceAccess(typeof body?.operatorToken === "string" ? body.operatorToken : undefined);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const model = process.env.BYS_REVIEW_MODEL?.trim() || DEFAULT_REVIEW_MODEL;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${access.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: buildPracticeReviewPrompt(agenda, practiceTurns),
        text: {
          format: {
            type: "json_schema",
            name: "practice_review",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["transcriptRevision", "items"],
              properties: {
                transcriptRevision: { type: "string" },
                items: { type: "array", items: { type: "object", additionalProperties: false, required: ["questionId", "gap", "turnIds", "rationale", "followUp"], properties: { questionId: { type: "string" }, gap: { type: "string" }, turnIds: { type: "array", items: { type: "string" } }, rationale: { type: "string" }, followUp: { type: "string" } } } },
              },
            },
          },
        },
      }),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok) return NextResponse.json({ error: "Practice review is unavailable." }, { status: response.status });
    const output = typeof data?.output_text === "string" ? data.output_text : null;
    let parsed: unknown = null;
    if (output) {
      try { parsed = JSON.parse(output); } catch { parsed = null; }
    }
    const review = parsePracticeReview(parsed, agenda, practiceTurns);
    if (!review) return NextResponse.json({ error: "Practice review is unavailable." }, { status: 502 });
    return NextResponse.json({ review, provider: "openai", model });
  } catch {
    return NextResponse.json({ error: "Practice review is unavailable." }, { status: 502 });
  }
}
