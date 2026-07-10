import { NextResponse } from "next/server";

import {
  deleteRecoveredReport,
  getRecoveredReport,
  isRecoveryEnabled,
} from "@/lib/persistence/report-store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ recoveryToken: string }> },
) {
  if (!isRecoveryEnabled()) {
    return NextResponse.json({ ok: false, error: "Recovery is not enabled." }, { status: 404 });
  }

  const { recoveryToken } = await context.params;
  const report = getRecoveredReport(recoveryToken);
  if (!report) {
    return NextResponse.json({ ok: false, error: "Report not found or expired." }, { status: 410 });
  }

  return NextResponse.json({ ok: true, report });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ recoveryToken: string }> },
) {
  if (!isRecoveryEnabled()) {
    return NextResponse.json({ ok: false, error: "Recovery is not enabled." }, { status: 404 });
  }

  const { recoveryToken } = await context.params;
  const deleted = deleteRecoveredReport(recoveryToken);
  return NextResponse.json({ ok: deleted }, { status: deleted ? 200 : 410 });
}
