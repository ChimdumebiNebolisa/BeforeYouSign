import path from "node:path";
import { pathToFileURL } from "node:url";

import { normalizeLeasePageText } from "@/lib/pdf/normalize";

export type ExtractedTextPage = {
  page: number;
  text: string;
};

let pdfWorkerConfigured = false;

type PdfParseInstance = {
  getInfo: () => Promise<{ total: number }>;
  getText: (options: { partial: number[] }) => Promise<{ text: string }>;
  destroy: () => Promise<void>;
};

type PdfParseCtor = {
  new (input: { data: Buffer }): PdfParseInstance;
  setWorker: (workerSrc: string) => void;
};

let cachedPdfParseCtor: PdfParseCtor | null = null;

async function ensurePdfRuntimePolyfills(): Promise<void> {
  const g = globalThis as Record<string, unknown>;

  if (!g.DOMMatrix) {
    const { default: CSSMatrix } = await import("@thednp/dommatrix");
    g.DOMMatrix = CSSMatrix;
  }

  if (!g.ImageData) {
    g.ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;

      constructor(dataOrWidth: Uint8ClampedArray | number, width?: number, height?: number) {
        if (typeof dataOrWidth === "number") {
          this.width = dataOrWidth;
          this.height = typeof width === "number" ? width : 0;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
          return;
        }

        this.data = dataOrWidth;
        this.width = typeof width === "number" ? width : 0;
        this.height = typeof height === "number" ? height : 0;
      }
    };
  }

  if (!g.Path2D) {
    g.Path2D = class Path2D {
      constructor() {}
    };
  }
}

async function getPdfParseCtor(): Promise<PdfParseCtor> {
  if (cachedPdfParseCtor) {
    return cachedPdfParseCtor;
  }

  await ensurePdfRuntimePolyfills();
  const mod = (await import("pdf-parse")) as { PDFParse: PdfParseCtor };
  cachedPdfParseCtor = mod.PDFParse;
  return cachedPdfParseCtor;
}

async function ensurePdfWorkerConfigured(): Promise<void> {
  if (pdfWorkerConfigured) return;

  const PDFParse = await getPdfParseCtor();

  // pdf-parse bundles pdf.js; Next/Turbopack can break the default worker path resolution.
  // Point explicitly at the worker shipped with pdf-parse.
  const workerAbsPath = path.join(process.cwd(), "node_modules", "pdf-parse", "dist", "pdf-parse", "web", "pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerAbsPath).toString());
  pdfWorkerConfigured = true;
}

export async function extractPdfTextPages(arrayBuffer: ArrayBuffer): Promise<ExtractedTextPage[]> {
  await ensurePdfWorkerConfigured();

  const PDFParse = await getPdfParseCtor();
  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });

  try {
    const info = await parser.getInfo();
    const totalPages = info.total;

    const pages: ExtractedTextPage[] = [];
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      const pageText = await parser.getText({ partial: [pageNumber] });
      const text = normalizeLeasePageText(pageText.text);
      pages.push({ page: pageNumber, text });
    }

    return pages;
  } finally {
    await parser.destroy();
  }
}
