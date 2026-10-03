"use client";

import { useId, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";

export function UploadLeaseCta({ onStartUpload }: { onStartUpload: (file: File) => void }) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      setErrorMessage("We only accept PDF files. Please upload a PDF version of your lease.");
      return;
    }
    if (file.size > ANALYSIS_LIMITS.maxPdfBytes) {
      setErrorMessage(
        `This PDF exceeds the ${Math.round(ANALYSIS_LIMITS.maxPdfBytes / (1024 * 1024))} MB upload limit.`,
      );
      return;
    }

    setSelectedFileName(file.name);
    setErrorMessage(null);
    onStartUpload(file);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          handleFile(file);
        }}
      />

      <div className="relative">
        <button
          type="button"
          className={[
            "relative flex min-h-[9rem] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-4 py-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isDragActive
              ? "border-primary/45 bys-float-shadow"
              : "border-border/35 hover:border-primary/35",
          ].join(" ")}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
            const file = e.dataTransfer.files?.[0];
            handleFile(file);
          }}
        >
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary transition-transform hover:scale-105">
            <Upload className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="mt-2 block text-sm font-semibold text-foreground">Click to upload or drag &amp; drop</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">PDF lease document</span>
          <span className="mt-3 flex h-9 w-full items-center justify-center rounded-lg bys-gradient-cta text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-95 active:scale-[0.99]">
            Choose PDF
          </span>
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm font-medium text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {selectedFileName ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status" aria-live="polite">
          Selected: <span className="font-semibold text-foreground">{selectedFileName}</span>
        </p>
      ) : null}
    </div>
  );
}
