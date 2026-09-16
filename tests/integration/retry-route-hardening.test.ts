import { describe, expect, it } from "vitest";

import { POST as analyzePost } from "@/app/api/analyze/route";
import { POST as retryPost } from "@/app/api/analyze/retry-model/route";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("analysis routes", () => {
  it("removes the former AI retry endpoint", async () => {
    const response = await retryPost(
      jsonRequest("http://localhost/api/analyze/retry-model", { documentId: "removed" }),
    );

    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining("AI analysis has been removed"),
    });
  });

  it("still rejects oversized pasted text before processing", async () => {
    const response = await analyzePost(
      jsonRequest("http://localhost/api/analyze", { leaseText: "x".repeat(120_001) }),
    );
    expect(response.status).toBe(413);
  });
});
