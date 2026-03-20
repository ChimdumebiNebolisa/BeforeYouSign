import { PDFParse } from "pdf-parse";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type ExtractedTextPage = {
  page: number;
  text: string;
};

let pdfWorkerConfigured = false;

function ensurePdfWorkerConfigured() {
  if (pdfWorkerConfigured) return;

  // pdf-parse bundles pdf.js; Next/Turbopack can break the default worker path resolution.
  // Point explicitly at the worker shipped with pdf-parse.
  const workerAbsPath = path.join(process.cwd(), "node_modules", "pdf-parse", "dist", "pdf-parse", "web", "pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerAbsPath).toString());
  pdfWorkerConfigured = true;
}

export async function extractPdfTextPages(arrayBuffer: ArrayBuffer): Promise<ExtractedTextPage[]> {
  ensurePdfWorkerConfigured();

  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });

  try {
    const info = await parser.getInfo();
    const totalPages = info.total;

    const pages: ExtractedTextPage[] = [];
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      const pageText = await parser.getText({ partial: [pageNumber] });
      const text = pageText.text.replace(/\s+/g, " ").trim();
      pages.push({ page: pageNumber, text });
    }

    return pages;
  } finally {
    await parser.destroy();
  }
}
