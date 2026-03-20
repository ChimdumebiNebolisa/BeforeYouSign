"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadLeaseCta } from "@/components/beforeyousign/upload-lease-cta";
import { SampleLeaseCta } from "@/components/beforeyousign/sample-lease-cta";
import { PasteTextDialog } from "@/components/beforeyousign/paste-text-dialog";

type IntakeState =
  | { kind: "upload"; file: File }
  | { kind: "sample"; text: string }
  | { kind: "paste"; text: string };

export function LandingClient() {
  const [intake, setIntake] = useState<IntakeState | null>(null);
  const [uploadReceipt, setUploadReceipt] = useState<{
    fileName: string;
    fileSizeBytes: number;
    contentType: string | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetIntakeUi = () => {
    setUploadReceipt(null);
    setIsSubmitting(false);
    setErrorMessage(null);
  };

  if (intake) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center font-sans">
        <main className="flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/60 px-5 py-10 backdrop-blur shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Lease intake</h1>
          {intake.kind === "upload" ? (
            <p className="text-sm text-slate-700">
              Upload received: <span className="font-medium">{intake.file.name}</span>
            </p>
          ) : null}
          {intake.kind === "sample" ? (
            <p className="text-sm text-slate-700">
              Sample loaded: <span className="font-medium">{intake.text.length.toLocaleString()} chars</span>
            </p>
          ) : null}
          {intake.kind === "paste" ? (
            <p className="text-sm text-slate-700">
              Pasted text loaded: <span className="font-medium">{intake.text.length.toLocaleString()} chars</span>
            </p>
          ) : null}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="rounded-full border-slate-200/70 bg-white/40 hover:bg-white/60"
              onClick={() => {
                resetIntakeUi();
                setIntake(null);
              }}
            >
              Back to landing
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                if (intake.kind !== "upload") return;

                const run = async () => {
                  try {
                    setIsSubmitting(true);
                    setErrorMessage(null);
                    setUploadReceipt(null);

                    const formData = new FormData();
                    formData.append("file", intake.file, intake.file.name);

                    const res = await fetch("/api/analyze", {
                      method: "POST",
                      body: formData,
                    });

                    if (!res.ok) {
                      const text = await res.text();
                      throw new Error(text || `Request failed with ${res.status}`);
                    }

                    const data = (await res.json()) as {
                      fileName: string;
                      fileSizeBytes: number;
                      contentType: string | null;
                    };
                    setUploadReceipt(data);
                  } catch (e) {
                    setErrorMessage(e instanceof Error ? e.message : "Failed to send PDF to backend.");
                  } finally {
                    setIsSubmitting(false);
                  }
                };

                void run();
              }}
              disabled={intake.kind !== "upload" || isSubmitting}
            >
              {isSubmitting ? "Sending PDF..." : "Continue to analysis"}
            </Button>
          </div>

          {uploadReceipt ? (
            <div className="mt-2 rounded-xl border border-slate-200/70 bg-white/60 p-3 text-sm text-slate-800">
              Backend received: <span className="font-medium">{uploadReceipt.fileName}</span> (
              {uploadReceipt.fileSizeBytes.toLocaleString()} bytes)
              {uploadReceipt.contentType ? `, ${uploadReceipt.contentType}` : null}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-3xl border border-slate-200/60 bg-white/60 px-5 py-10 backdrop-blur shadow-sm sm:px-8 sm:py-12 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-slate-900">
            Understand your lease before you sign
          </h1>
          <p className="max-w-md text-lg leading-8 text-slate-600">
            Upload or paste your lease text to understand key terms before you sign.
          </p>

          <UploadLeaseCta
            onStartUpload={(file) => {
              resetIntakeUi();
              setIntake({ kind: "upload", file });
            }}
          />
          <SampleLeaseCta
            onStartSample={(text) => {
              resetIntakeUi();
              setIntake({ kind: "sample", text });
            }}
          />
          <PasteTextDialog
            onStartPaste={(text) => {
              resetIntakeUi();
              setIntake({ kind: "paste", text });
            }}
          />
        </div>
      </main>
    </div>
  );
}

