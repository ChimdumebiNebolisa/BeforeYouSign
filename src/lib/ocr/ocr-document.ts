import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

export type OcrPageResult = {
  page: number;
  text: string;
  confidence: number;
};

export type OcrProvider = {
  extractPages: (pdfBytes: ArrayBuffer) => Promise<OcrPageResult[]>;
};

/** Placeholder OCR provider — returns empty until a real provider is configured. */
export const noopOcrProvider: OcrProvider = {
  async extractPages() {
    return [];
  },
};

export async function maybeApplyOcr(
  _pdfBytes: ArrayBuffer,
  existingPages: ExtractedTextPage[],
): Promise<{ pages: OcrPageResult[]; attempted: number; failed: number }> {
  if (process.env.BYS_OCR_ENABLED !== "1") {
    return { pages: [], attempted: 0, failed: 0 };
  }

  const provider = noopOcrProvider;
  try {
    const pages = await provider.extractPages(_pdfBytes);
    return {
      pages,
      attempted: existingPages.length,
      failed: pages.length === 0 ? existingPages.length : 0,
    };
  } catch {
    return { pages: [], attempted: existingPages.length, failed: existingPages.length };
  }
}
