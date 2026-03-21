export function normalizeLeasePageText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Non-breaking spaces often appear in PDF text runs.
  text = text.replace(/\u00a0/g, " ");

  // Hyphenation from line wraps: "some-\nthing" -> "something"
  text = text.replace(/-\n/g, "");

  // Hard wraps mid-word/sentence (common in PDF text extraction): join when it looks like a continuation.
  // Conservative: lowercase letter at end of line + lowercase letter at start of next line.
  text = text.replace(/(?<=[a-z])\n(?=[a-z])/g, " ");

  // Collapse horizontal whitespace (excluding newlines).
  text = text.replace(/[ \t\f\v]+/g, " ");

  // Trim each line; remove empty lines from the noise.
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // Keep paragraph breaks, but avoid huge vertical gaps.
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
