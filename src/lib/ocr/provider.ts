import type { OcrProvider } from "@/lib/ocr/ocr-document";

export function getOcrProvider(): OcrProvider | null {
  if (process.env.BYS_OCR_ENABLED !== "1") return null;
  return null;
}
