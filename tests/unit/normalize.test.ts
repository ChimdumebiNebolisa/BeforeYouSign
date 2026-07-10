import { describe, expect, it } from "vitest";

import { normalizeLeasePageText } from "@/lib/pdf/normalize";

describe("normalizeLeasePageText", () => {
  it("normalizes CRLF and NBSP", () => {
    const raw = "Rent\u00a0is\r\n$1,200";
    expect(normalizeLeasePageText(raw)).toBe("Rent is\n$1,200");
  });

  it("de-hyphenates line wraps", () => {
    const raw = "some-\nthing important";
    expect(normalizeLeasePageText(raw)).toBe("something important");
  });

  it("joins lowercase letter line breaks", () => {
    const raw = "monthly\nrent is due";
    expect(normalizeLeasePageText(raw)).toBe("monthly rent is due");
  });

  it("collapses horizontal whitespace", () => {
    const raw = "Rent   is\t\tdue";
    expect(normalizeLeasePageText(raw)).toBe("Rent is due");
  });

  it("removes empty lines and trims", () => {
    const raw = "  Line one  \n\n\n  Line two  ";
    expect(normalizeLeasePageText(raw)).toBe("Line one\nLine two");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeLeasePageText("   \n\n  ")).toBe("");
  });
});
