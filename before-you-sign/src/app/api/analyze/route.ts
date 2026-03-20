import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { ok: false, error: "Missing file. Expected multipart form field 'file'." },
      { status: 400 },
    );
  }

  const fileName = (file as unknown as { name?: string }).name ?? "uploaded.pdf";
  const fileSizeBytes = file.size;
  const contentType = file.type || null;

  return NextResponse.json({
    ok: true,
    fileName,
    fileSizeBytes,
    contentType,
  });
}

