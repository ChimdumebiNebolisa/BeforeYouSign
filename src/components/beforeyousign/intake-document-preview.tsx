"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

export type IntakeDocumentPreviewIntake =
  | { kind: "upload"; file: File }
  | { kind: "sample"; text: string }
  | { kind: "paste"; text: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileLabel(intake: IntakeDocumentPreviewIntake): string {
  if (intake.kind === "upload") return intake.file.name;
  if (intake.kind === "sample") return "sample-lease.txt";
  return "pasted-lease.txt";
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function textSnippet(text: string, maxChars: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars).trimEnd()}…`;
}

export function IntakeDocumentPreview({ intake }: { intake: IntakeDocumentPreviewIntake }) {
  const [pdfPageCount, setPdfPageCount] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    if (intake.kind !== "upload") {
      setPdfPageCount(undefined);
      return;
    }
    const file = intake.file;
    if (!isPdfFile(file)) {
      setPdfPageCount(undefined);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const buf = await file.arrayBuffer();
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        if (!cancelled) setPdfPageCount(doc.getPageCount());
      } catch {
        if (!cancelled) setPdfPageCount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [intake]);

  const title = fileLabel(intake);
  const metaLine =
    intake.kind === "upload"
      ? `${formatBytes(intake.file.size)}${
          isPdfFile(intake.file)
            ? pdfPageCount === undefined
              ? " · reading pages…"
              : pdfPageCount !== null
                ? ` · ${pdfPageCount} page${pdfPageCount === 1 ? "" : "s"}`
                : " · page count unavailable"
            : ""
        }`
      : `${intake.text.length.toLocaleString()} characters`;

  const previewLabel =
    intake.kind === "upload"
      ? isPdfFile(intake.file)
        ? "Ready for analysis"
        : "Ready to read"
      : "Preview";

  const previewBody =
    intake.kind === "upload"
      ? isPdfFile(intake.file)
        ? "We’ll read your PDF and highlight key terms like rent, fees, renewal rules, notice periods, and utilities."
        : "We’ll read this file and highlight key lease terms when you continue."
      : textSnippet(intake.text, 220) || "No text to preview.";

  return (
    <div className="rounded-2xl border border-[#e8eaef]/80 bg-[#f7f9fb] p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffffff] shadow-sm ring-1 ring-[#e8eaef]">
          <FileText className="h-6 w-6 text-[#00246a]" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-[family-name:var(--font-headline)] text-sm font-bold text-[#191c1e] sm:text-base">
              {title}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#757682]">{metaLine}</p>
          </div>
          <div className="rounded-xl border border-[#e0e3e8]/90 bg-[#ffffff] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#757682]">{previewLabel}</p>
            <p
              className={[
                "mt-1.5 text-[13px] leading-snug text-[#444651]",
                intake.kind === "upload" ? "" : "max-h-[4.5rem] overflow-hidden font-mono text-[12px]",
              ].join(" ")}
            >
              {previewBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
