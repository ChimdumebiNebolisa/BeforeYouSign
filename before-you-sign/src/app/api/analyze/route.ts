import { NextResponse } from "next/server";

import { findRentSnippets } from "@/lib/analysis/rules";
import { extractPdfTextPages } from "@/lib/pdf/extract-text";

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

  try {
    const bytes = await file.arrayBuffer();
    const extractedPages = await extractPdfTextPages(bytes);
    const rentSnippets = findRentSnippets(extractedPages);

    if (process.env.BEFOREYOUSIGN_PDF_DEBUG === "1") {
      console.log(
        "[beforeyousign][pdf] extracted",
        JSON.stringify({
          fileName,
          pages: extractedPages.length,
          charsPerPage: extractedPages.map((p) => p.text.length),
          rentSnippets: rentSnippets.length,
        }),
      );
    }

    return NextResponse.json({
      ok: true,
      fileName,
      fileSizeBytes,
      contentType,
      extractedPages,
      rentSnippets,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to extract text from this PDF.",
      },
      { status: 400 },
    );
  }
}

