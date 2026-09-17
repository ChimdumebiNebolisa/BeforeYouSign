import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { extractPdfTextPages, PdfPageLimitError } from "@/lib/pdf/extract-text";

describe("PDF extraction limits", () => {
  it("rejects an oversized page count before extracting page text", async () => {
    const pdf = await PDFDocument.create();
    for (let page = 0; page < 101; page += 1) pdf.addPage();
    const bytes = await pdf.save();

    await expect(extractPdfTextPages(new Uint8Array(bytes).buffer)).rejects.toMatchObject({
      name: "PdfPageLimitError",
      actual: 101,
      limit: 100,
    } satisfies Partial<PdfPageLimitError>);
  }, 30_000);
});
