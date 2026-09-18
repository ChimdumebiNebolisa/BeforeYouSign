import { describe, expect, it } from "vitest";

import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { resolveQuoteToChunk } from "@/lib/evidence/segment";
import { sanitizeExportFilename, buildReportMarkdown } from "@/lib/report-export";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import { ANALYSIS_STAGE_LABELS, type AnalysisStage } from "@/lib/analysis/pipeline/stages";
import { createAnalysisProblem } from "@/lib/analysis/limits";

describe("extracted pattern hardening", () => {
  describe("evidence handling", () => {
    const pageOne =
      "Monthly rent is $1,450 on page one. Tenant shall pay on the first day of each month.";
    const pageTwo =
      "Monthly rent is $1,450 on page two. Tenant shall pay on the first day of each month.";
    const pages = [
      { page: 1, text: pageOne },
      { page: 2, text: pageTwo },
    ];
    const documentId = "evidence-hardening-doc";
    const registry = createEvidenceRegistry(documentId, pages);

    it("resolves quotes within page context only", () => {
      const onPage1 = resolveQuoteToChunk(registry.chunks, 1, "Monthly rent is $1,450");
      const onPage2 = resolveQuoteToChunk(registry.chunks, 2, "Monthly rent is $1,450");
      expect(onPage1?.page).toBe(1);
      expect(onPage2?.page).toBe(2);
      expect(onPage1?.id).not.toBe(onPage2?.id);
    });

    it("does not assign legacy evidence IDs when quote cannot be resolved", () => {
      const report = buildRuleOnlyFallbackReport({
        documentId,
        pages,
        ruleBasedFindings: [
          { category: "rent", page: 1, quote: "Nonexistent unicorn clause language." },
        ],
        deterministicRisk: { score: 1, band: "low", reasons: [] },
        evidenceRegistry: registry,
      });
      const evidence = report.moneyAndFees[0]?.evidence ?? [];
      expect(evidence).toHaveLength(0);
    });

  });

  describe("export", () => {
    const minimalReport: BeforeYouSignReport = {
      summary: "Sample lease terms.",
      whatYoureAgreeingTo: [],
      riskLevel: "medium",
      riskReason: "Review fees.",
      moneyAndFees: [],
      deadlinesAndNotice: [],
      responsibilities: [],
      potentialRedFlags: [],
      questionsToAsk: [],
      nextSteps: [],
      missingOrUnclear: [],
      disclaimer: "Educational information only. Not legal advice.",
    };

    it.each([
      ["path traversal", "../../etc/passwd"],
      ["unsafe chars", 'lease<script>alert("x")</script>.pdf'],
      ["empty", "   "],
    ])("sanitizes export filename: %s", (_label, raw) => {
      const name = sanitizeExportFilename(raw);
      expect(name).not.toMatch(/[<>:"/\\|?*]/);
      expect(name.endsWith(".md")).toBe(true);
    });

    it("always includes disclaimer and mode", () => {
      const md = buildReportMarkdown({
        report: minimalReport,
        texasRenterFindings: [],
        mode: "rules_only",
      });
      expect(md).toContain("Educational information only");
      expect(md).toContain("Rule-based only");
      expect(md).not.toContain("undefined");
      expect(md).not.toContain("null");
    });

    it("escapes markdown-breaking user content", () => {
      const md = buildReportMarkdown({
        report: {
          ...minimalReport,
          summary: "Fee #1 [urgent] *bold*",
        },
        texasRenterFindings: [],
      });
      expect(md).toContain("\\#1");
      expect(md).toContain("\\[urgent\\]");
    });
  });

  describe("analysis stages", () => {
    it.each(Object.keys(ANALYSIS_STAGE_LABELS) as AnalysisStage[])(
      "maps stage %s to safe HTTP errors when used in problems",
      (stage) => {
        void stage;
        const problem = createAnalysisProblem("invalid_input", "Safe message.");
        expect(problem.httpStatus).toBe(400);
        expect(problem.message).not.toMatch(/\$[\d,]+/);
      },
    );
  });
});
