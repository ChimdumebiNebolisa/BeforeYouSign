"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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
      setErrorMessage("Please upload a PDF lease file.");
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

      <div
        className={[
          "mt-6 w-full cursor-pointer rounded-2xl border px-5 py-6 text-center transition-colors",
          "border-slate-200/70 bg-white/35 backdrop-blur",
          isDragActive ? "border-slate-300 bg-white/60" : "hover:bg-white/45",
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
        <Button
          type="button"
          className="rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Upload Lease
        </Button>

        <p className="mt-2 text-xs text-slate-600">
          Or drag and drop a PDF lease here.
        </p>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
      ) : null}

      {selectedFileName ? (
        <p className="mt-3 text-sm text-slate-700">
          Selected: <span className="font-medium">{selectedFileName}</span>
        </p>
      ) : null}
    </div>
  );
}

