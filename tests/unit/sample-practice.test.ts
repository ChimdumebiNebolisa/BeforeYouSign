import { describe, expect, it, vi } from "vitest";
import { samplePractice } from "@/lib/practice/sample";

describe("sample practice", () => {
  it("uses local fictional fixtures and makes no provider request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const sample = samplePractice();
    expect(sample.turns.length).toBeGreaterThan(0);
    expect(sample.review.items.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
