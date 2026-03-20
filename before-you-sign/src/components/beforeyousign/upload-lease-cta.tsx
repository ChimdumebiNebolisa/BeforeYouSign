"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function UploadLeaseCta() {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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
          setSelectedFileName(file?.name ?? null);
        }}
      />

      <Button
        className="mt-6 rounded-full"
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        Upload Lease
      </Button>

      {selectedFileName ? (
        <p className="mt-3 text-sm text-slate-700">
          Selected: <span className="font-medium">{selectedFileName}</span>
        </p>
      ) : null}
    </div>
  );
}

