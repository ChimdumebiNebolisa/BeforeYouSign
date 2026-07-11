"use client";

import { Download } from "lucide-react";

export function DownloadMarkdownButton({
  label,
  downloadFileName,
  buildMarkdown,
}: {
  label: string;
  downloadFileName: string;
  buildMarkdown: () => string;
}) {
  const handleDownload = () => {
    const markdown = buildMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-card px-4 text-sm font-semibold text-primary shadow-sm transition hover:bg-muted"
    >
      <Download className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
