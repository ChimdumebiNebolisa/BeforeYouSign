import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BASE_URL = "https://api.heycall-e.com";
const E164_PHONE = /^\+[1-9]\d{7,14}$/;
const CALL_ID = /^[A-Za-z0-9_-]{3,200}$/;

type CreateCallBody = {
  phone?: unknown;
  questions?: unknown;
  confirmed?: unknown;
  dryRun?: unknown;
};

function getConfig() {
  const apiKey = process.env.CALLE_API_KEY?.trim();
  const baseUrl = (process.env.CALLE_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  return { apiKey, baseUrl };
}

function cleanQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((item) => item.slice(0, 300));
}

function buildTask(phone: string, questions: string[]) {
  const numbered = questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
  return [
    `Call ${phone}, a residential leasing office, on behalf of a renter using BeforeYouSign.`,
    "At the start of the conversation, clearly identify yourself as an automated assistant calling on behalf of a renter to clarify factual lease terms.",
    "Ask only the questions below. Do not negotiate, threaten, provide legal advice, impersonate the renter, or agree to any new terms.",
    "If the person cannot answer a question, record it as unresolved. If they ask to speak directly with the renter, politely end the call and mark follow-up as needed.",
    "Questions:",
    numbered,
    "Return a concise structured result with what was answered, what remains unresolved, and whether human follow-up is needed.",
  ].join("\n\n");
}

function normalizeCallResult(data: unknown) {
  const root = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested = root.call && typeof root.call === "object" ? (root.call as Record<string, unknown>) : {};
  const source = Object.keys(nested).length ? nested : root;

  const callId =
    (typeof source.id === "string" && source.id) ||
    (typeof source.call_id === "string" && source.call_id) ||
    (typeof root.id === "string" && root.id) ||
    (typeof root.call_id === "string" && root.call_id) ||
    null;

  return {
    callId,
    status: typeof source.status === "string" ? source.status : null,
    taskCompleted:
      typeof source.task_completed === "boolean"
        ? source.task_completed
        : typeof source.taskCompleted === "boolean"
          ? source.taskCompleted
          : null,
    summary:
      typeof source.summary === "string"
        ? source.summary
        : typeof root.summary === "string"
          ? root.summary
          : null,
    structuredResult: source.structured_result ?? source.structuredResult ?? null,
    evidence: Array.isArray(source.evidence) ? source.evidence : [],
    recipients: Array.isArray(source.recipients) ? source.recipients : [],
  };
}

export async function POST(request: NextRequest) {
  let body: CreateCallBody;
  try {
    body = (await request.json()) as CreateCallBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!E164_PHONE.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid E.164 phone number, for example +12025550123." },
      { status: 400 },
    );
  }

  const questions = cleanQuestions(body.questions);
  if (questions.length === 0) {
    return NextResponse.json({ error: "Add at least one lease clarification question." }, { status: 400 });
  }

  const task = buildTask(phone, questions);
  const dryRun = body.dryRun !== false;
  if (dryRun) {
    return NextResponse.json({
      callId: null,
      status: "preview",
      taskCompleted: null,
      summary: "Dry run only. No phone call was placed.",
      structuredResult: {
        phone,
        questions,
        task,
        sideEffect: "none",
        nextStep: "Enable live calling and explicitly confirm before dispatching to CALL-E.",
      },
      evidence: [],
      recipients: [],
    });
  }

  if (body.confirmed !== true) {
    return NextResponse.json(
      { error: "Explicit confirmation is required before BeforeYouSign can place a real phone call." },
      { status: 400 },
    );
  }

  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    return NextResponse.json(
      { error: "CALL-E is not configured. Add CALLE_API_KEY on the server before placing calls." },
      { status: 503 },
    );
  }

  const providerResponse = await fetch(`${baseUrl}/v1/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `beforeyousign_${randomUUID()}`,
    },
    body: JSON.stringify({
      task,
      recipients: [
        {
          phones: [phone],
          region: "US",
          locale: "en-US",
        },
      ],
      recipient_result_schema: {
        type: "object",
        required: ["outcome", "answers", "unresolved", "follow_up_needed"],
        properties: {
          outcome: {
            type: "string",
            enum: ["answered", "partially_answered", "unreachable", "declined", "unknown"],
          },
          answers: { type: "string" },
          unresolved: { type: "string" },
          follow_up_needed: { type: "boolean" },
        },
      },
      metadata: {
        product: "BeforeYouSign",
        workflow: "lease-clarification",
      },
    }),
    cache: "no-store",
  });

  const providerBody = await providerResponse.json().catch(() => null);
  if (!providerResponse.ok) {
    const providerMessage =
      providerBody && typeof providerBody === "object" && "message" in providerBody
        ? String((providerBody as { message?: unknown }).message ?? "")
        : "";
    return NextResponse.json(
      { error: providerMessage || `CALL-E rejected the request (${providerResponse.status}).` },
      { status: providerResponse.status },
    );
  }

  return NextResponse.json(normalizeCallResult(providerBody), { status: 201 });
}

export async function GET(request: NextRequest) {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    return NextResponse.json({ error: "CALL-E is not configured." }, { status: 503 });
  }

  const callId = request.nextUrl.searchParams.get("callId")?.trim() || "";
  if (!CALL_ID.test(callId)) {
    return NextResponse.json({ error: "Invalid CALL-E call id." }, { status: 400 });
  }

  const providerResponse = await fetch(`${baseUrl}/v1/calls/${encodeURIComponent(callId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const providerBody = await providerResponse.json().catch(() => null);

  if (!providerResponse.ok) {
    return NextResponse.json(
      { error: `Unable to read the CALL-E result (${providerResponse.status}).` },
      { status: providerResponse.status },
    );
  }

  return NextResponse.json(normalizeCallResult(providerBody));
}
