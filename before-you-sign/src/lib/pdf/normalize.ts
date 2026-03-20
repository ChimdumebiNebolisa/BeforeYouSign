export function normalizeLeasePageText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Non-breaking spaces often appear in PDF text runs.
  text = text.replace(/\u00a0/g, " ");

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
