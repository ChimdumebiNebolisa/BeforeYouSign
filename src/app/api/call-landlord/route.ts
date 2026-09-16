import { NextResponse } from "next/server";

const REMOVED_MESSAGE = "Outbound phone calling was removed from BeforeYouSign. Use /practice for fictional rehearsal.";

export function POST(_request: Request) {
  void _request;
  return NextResponse.json({ error: REMOVED_MESSAGE }, { status: 410 });
}

export function GET(_request: Request) {
  void _request;
  return NextResponse.json({ error: REMOVED_MESSAGE }, { status: 410 });
}
