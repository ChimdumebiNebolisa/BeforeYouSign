"use client";

import { useId, useRef, useState } from "react";
import { Upload } from "lucide-react";

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
        <div className="pointer-events-none absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-[#00246a]/10 to-transparent opacity-25 blur-sm" />
        <div
          className={[
            "relative cursor-pointer rounded-3xl border-2 border-dashed bg-[#ffffff] p-10 text-center transition-all",
            isDragActive
              ? "border-[#00246a]/45 shadow-[0px_12px_32px_rgba(0,36,106,0.12)]"
              : "border-[#c5c5d3]/35 hover:border-[#00246a]/35",
          ].join(" ")}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dbe1ff] text-[#00246a] transition-transform hover:scale-105">
            <Upload className="h-7 w-7" strokeWidth={2} aria-hidden />
          </div>
          <p className="mt-4 font-semibold text-[#191c1e]">Click to upload or drag &amp; drop</p>
          <p className="mt-1 text-xs text-[#444651]">PDF up to your server limits</p>
          <button
            type="button"
            className="mt-5 h-11 w-full rounded-xl bys-gradient-cta text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Choose PDF
          </button>
        </div>
      </div>

      {errorMessage ? <p className="mt-3 text-sm font-medium text-[#ba1a1a]">{errorMessage}</p> : null}

      {selectedFileName ? (
        <p className="mt-3 text-sm text-[#444651]">
          Selected: <span className="font-semibold text-[#191c1e]">{selectedFileName}</span>
        </p>
      ) : null}
    </div>
  );
}
