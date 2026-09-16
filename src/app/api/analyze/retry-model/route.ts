import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function POST(_request: Request) {
  void _request;
  return NextResponse.json({ error: "AI analysis has been removed. The review uses deterministic lease pattern matching." }, { status: 410 });
}
