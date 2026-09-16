import { NextRequest, NextResponse } from "next/server";
import { practiceAccess } from "@/lib/practice/config";
import { parseAgendaSnapshot } from "@/lib/practice/contracts";

function bodyObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null;
  try {
    body = bodyObject(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  if (!body || typeof body.sdp !== "string" || body.sdp.length < 20 || body.sdp.length > 250_000) {
    return NextResponse.json({ error: "A valid WebRTC session description is required." }, { status: 400 });
  }
  const agenda = parseAgendaSnapshot(body.agenda);
  if (!agenda) return NextResponse.json({ error: "A valid reviewed agenda is required." }, { status: 400 });
  const operatorToken = typeof body.operatorToken === "string" ? body.operatorToken : undefined;
  const access = practiceAccess(operatorToken);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const sessionConfig = JSON.stringify({
    type: "realtime",
    model: access.model,
    audio: { output: { voice: "marin" } },
    instructions: [
      "PRACTICE — AI ROLE-PLAY. NO LEASING OFFICE IS BEING CONTACTED.",
      "You are a fictional leasing representative in a rehearsal. Never claim to be the user's landlord or a real property employee.",
      "Ask which approved question the renter wants to discuss, answer only with clearly fictional scenario facts or say you cannot confirm a missing term, and expose vague answers that need exact follow-up.",
      `Approved questions:\n${agenda.items.slice(0, 3).map((item) => `${item.id}: ${item.question}`).join("\n")}`,
    ].join("\n\n"),
  });
  try {
    const form = new FormData();
    form.set("sdp", body.sdp);
    form.set("session", sessionConfig);
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${access.apiKey}` },
      body: form,
      cache: "no-store",
    });
    const sdp = await response.text();
    if (!response.ok || !sdp.trim()) return NextResponse.json({ error: "OpenAI could not create the practice session." }, { status: response.status || 502 });
    return new NextResponse(sdp, { status: 201, headers: { "Content-Type": "application/sdp", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Practice session creation failed." }, { status: 502 });
  }
}
