import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/analyze/route";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { hashDocumentId } from "@/lib/analysis/pipeline/validate-intake";

describe("POST /api/analyze", () => {
  it("returns 200 for valid pasted lease text with fake model path via pipeline limits", async () => {
    const sampleText = "Monthly rent is $1,450. Security deposit $1,450.";
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaseText: sampleText }),
    });

    const originalModelEnabled = process.env.BYS_MODEL_ENABLED;
    process.env.BYS_MODEL_ENABLED = "0";

    try {
      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { ok: boolean; stage?: string; documentId?: string };
      expect(body.ok).toBe(true);
      expect(body.stage).toBe("completed");
      expect(body.documentId).toBe(hashDocumentId(sampleText));
    } finally {
      if (originalModelEnabled === undefined) delete process.env.BYS_MODEL_ENABLED;
      else process.env.BYS_MODEL_ENABLED = originalModelEnabled;
    }
  });

  it("returns 413 for oversized pasted text", async () => {
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaseText: "x".repeat(120_001) }),
    });

    const response = await POST(request);
    expect(response.status).toBe(413);
    const body = (await response.json()) as { ok: boolean; stage?: string; error?: { code?: string } };
    expect(body.ok).toBe(false);
    expect(body.stage).toBe("validating_input");
    expect(body.error && typeof body.error === "object" ? body.error.code : null).toBe("too_many_chars");
  });
});

describe("POST /api/analyze/retry-model", () => {
  it("re-runs model analysis without PDF extraction", async () => {
    const sampleText = "Monthly rent is $1,450. Late fee $75.";
    const pages = [{ page: 1, text: sampleText }];
    const documentId = hashDocumentId(sampleText);
    const registry = createEvidenceRegistry(documentId, pages);

    const { POST: retryPost } = await import("@/app/api/analyze/retry-model/route");

    const originalModelEnabled = process.env.BYS_MODEL_ENABLED;
    process.env.BYS_MODEL_ENABLED = "0";

    try {
      const response = await retryPost(
        new Request("http://localhost/api/analyze/retry-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            pages,
            fileName: "retry-test.txt",
            fileSizeBytes: sampleText.length,
            contentType: "text/plain",
            extraction: {
              method: "pasted_text",
              pageCount: 1,
              totalChars: sampleText.length,
              quality: 1,
              coverageStatus: "complete",
            },
          }),
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        ok: boolean;
        stage?: string;
        documentId?: string;
        mode?: string;
      };
      expect(body.ok).toBe(true);
      expect(body.stage).toBe("completed");
      expect(body.documentId).toBe(documentId);
      expect(body.mode).toBe("rules_only");
    } finally {
      if (originalModelEnabled === undefined) delete process.env.BYS_MODEL_ENABLED;
      else process.env.BYS_MODEL_ENABLED = originalModelEnabled;
    }

    void registry;
    void buildRuleOnlyFallbackReport;
  });

  it("rejects retry when documentId hash mismatches", async () => {
    const { POST: retryPost } = await import("@/app/api/analyze/retry-model/route");
    const response = await retryPost(
      new Request("http://localhost/api/analyze/retry-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: "wrong-id",
          pages: [{ page: 1, text: "Monthly rent is $1,450." }],
          fileName: "bad.txt",
          fileSizeBytes: 10,
          contentType: "text/plain",
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { ok: boolean; error?: { code?: string } };
    expect(body.ok).toBe(false);
    expect(body.error && typeof body.error === "object" ? body.error.code : null).toBe("invalid_input");
  });
});
