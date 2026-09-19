import { ANALYSIS_LIMITS, createAnalysisProblem } from "@/lib/analysis/limits";
import type { AnalysisInput, NormalizedDocument } from "@/lib/analysis/pipeline/types";
import { computeContentIntegrityKey } from "@/lib/analysis/pipeline/content-integrity";
import { assessExtractionQuality, toDocumentExtraction } from "@/lib/pdf/extraction-quality";
import type { PdfExtractor } from "@/lib/analysis/pipeline/types";
import { PdfExtractionLimitError, type ExtractedTextPage } from "@/lib/pdf/extract-text";

export function validateExtractedPageLimits(pages: ExtractedTextPage[]) {
  if (pages.length > ANALYSIS_LIMITS.maxPages) {
    return createAnalysisProblem(
      "too_many_pages",
      `PDF exceeds the ${ANALYSIS_LIMITS.maxPages} page limit.`,
      { limit: ANALYSIS_LIMITS.maxPages, actual: pages.length },
    );
  }

  const totalChars = pages.reduce((sum, page) => sum + page.text.length, 0);
  if (totalChars > ANALYSIS_LIMITS.maxChars) {
    return createAnalysisProblem(
      "too_many_chars",
      `Extracted text exceeds the ${ANALYSIS_LIMITS.maxChars.toLocaleString()} character limit.`,
      { limit: ANALYSIS_LIMITS.maxChars, actual: totalChars },
    );
  }

  return null;
}

export async function analyzeDocument(
  input: AnalysisInput,
  extractPdfTextPages: PdfExtractor,
): Promise<
  | { ok: true; document: NormalizedDocument; contentType: string | null }
  | { ok: false; problem: ReturnType<typeof createAnalysisProblem> }
> {
  if (input.kind === "text") {
    const pages = [{ page: 1, text: input.leaseText }];
    const quality = assessExtractionQuality(pages);
    const documentId = computeContentIntegrityKey([{ page: 1, text: input.leaseText }]);
    return {
      ok: true,
      contentType: "text/plain",
      document: {
        documentId,
        pages,
        extraction: toDocumentExtraction("pasted_text", pages, quality),
      },
    };
  }

  let extractedPages;
  try {
    extractedPages = await extractPdfTextPages(input.bytes, {
      maxPages: ANALYSIS_LIMITS.maxPages,
      maxChars: ANALYSIS_LIMITS.maxChars,
    });
  } catch (error) {
    if (error instanceof PdfExtractionLimitError) {
      return {
        ok: false,
        problem: createAnalysisProblem(
          error.code,
          error.code === "too_many_pages"
            ? `PDF exceeds the ${error.limit} page limit.`
            : `Extracted text exceeds the ${error.limit.toLocaleString()} character limit.`,
          { limit: error.limit, actual: error.actual },
        ),
      };
    }

    return {
      ok: false,
      problem: createAnalysisProblem(
        "extraction_failed",
        "Failed to extract text from this PDF.",
      ),
    };
  }

  if (extractedPages.length > ANALYSIS_LIMITS.maxPages) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "too_many_pages",
        `PDF exceeds the ${ANALYSIS_LIMITS.maxPages} page limit.`,
        { limit: ANALYSIS_LIMITS.maxPages, actual: extractedPages.length },
      ),
    };
  }

  const quality = assessExtractionQuality(extractedPages);

  const totalChars = extractedPages.reduce((sum, p) => sum + p.text.length, 0);
  if (totalChars === 0) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "extraction_empty",
        "No extractable text was found in this PDF. If it is scanned, paste the lease text instead.",
      ),
    };
  }

  if (totalChars > ANALYSIS_LIMITS.maxChars) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "too_many_chars",
        `Extracted text exceeds the ${ANALYSIS_LIMITS.maxChars.toLocaleString()} character limit.`,
        { limit: ANALYSIS_LIMITS.maxChars, actual: totalChars },
      ),
    };
  }

  const documentId = computeContentIntegrityKey(extractedPages);
  const extraction = toDocumentExtraction("embedded_text", extractedPages, quality);

  return {
    ok: true,
    contentType: input.contentType,
    document: {
      documentId,
      pages: extractedPages,
      extraction,
    },
  };
}
