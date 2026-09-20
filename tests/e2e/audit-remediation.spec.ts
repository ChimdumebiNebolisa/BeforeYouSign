import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const SOURCE_TEXT = [
  "MONTHLY RENT",
  "Tenant shall pay monthly rent of $1,250 on the first day of each month.",
  "MAINTENANCE",
  "Tenant must promptly report maintenance problems to the landlord.",
  "NOTICE",
  "Tenant must give 30 days written notice before moving out.",
].join("\n");

const RENT_QUOTE = "Tenant shall pay monthly rent of $1,250 on the first day of each month.";
const MAINTENANCE_QUOTE = "Tenant must promptly report maintenance problems to the landlord.";
const NOTICE_QUOTE = "Tenant must give 30 days written notice before moving out.";

function evidence(quote: string, evidenceId: string) {
  const startIndex = SOURCE_TEXT.indexOf(quote);
  return {
    evidenceId,
    page: 1,
    quote,
    startIndex,
    endIndex: startIndex + quote.length,
    supportStatus: "grounded",
  };
}

function analysisResponse() {
  const rentEvidence = evidence(RENT_QUOTE, "page-1-rent");
  const maintenanceEvidence = evidence(MAINTENANCE_QUOTE, "page-1-maintenance");
  const noticeEvidence = evidence(NOTICE_QUOTE, "page-1-notice");

  return {
    ok: true,
    analysisVersion: 1,
    mode: "rules_only",
    stage: "complete",
    requestId: "e2e-request",
    stateCode: "TX",
    stateGuidance: "supported",
    documentId: "e2e-document",
    fileName: "pasted-lease.txt",
    fileSizeBytes: SOURCE_TEXT.length,
    contentType: "text/plain",
    document: {
      extraction: {
        method: "pasted_text",
        pageCount: 1,
        totalChars: SOURCE_TEXT.length,
        quality: 1,
        coverageStatus: "complete",
      },
    },
    extractedPages: [{ page: 1, text: SOURCE_TEXT }],
    rentSnippets: [{ page: 1, quote: RENT_QUOTE }],
    depositSnippets: [],
    feeSnippets: [],
    noticeSnippets: [{ page: 1, quote: NOTICE_QUOTE }],
    renewalSnippets: [],
    maintenanceSnippets: [{ page: 1, quote: MAINTENANCE_QUOTE }],
    utilitiesSnippets: [],
    ruleBasedFindings: [{ category: "maintenance", page: 1, quote: MAINTENANCE_QUOTE }],
    unclearLeasePhrases: [],
    texasRenterFindings: [],
    deterministicRiskScore: 2,
    deterministicRiskBand: "medium",
    deterministicRiskReasons: ["Review the maintenance and notice clauses."],
    evidenceIndex: {
      "page-1-rent": rentEvidence,
      "page-1-maintenance": maintenanceEvidence,
      "page-1-notice": noticeEvidence,
    },
    report: {
      summary: "This lease states monthly rent, maintenance reporting, and a move-out notice period.",
      whatYoureAgreeingTo: [
        "Pay monthly rent on the first day of each month.",
        "Report maintenance problems promptly.",
      ],
      riskLevel: "medium",
      riskReason: "The notice and maintenance terms deserve a careful read.",
      moneyAndFees: [{ label: "Monthly rent", value: "$1,250", evidence: [rentEvidence] }],
      deadlinesAndNotice: [{ label: "Move-out notice", value: "30 days written notice", evidence: [noticeEvidence] }],
      responsibilities: ["Tenant reports maintenance problems; landlord receives the report."],
      potentialRedFlags: [
        {
          id: "maintenance-clause",
          category: "maintenance",
          title: "Maintenance reporting duty",
          severity: "moderate",
          provenance: "deterministic",
          explanation: "The lease requires prompt maintenance reports.",
          whyItMatters: "Delays could complicate repair requests.",
          evidence: [maintenanceEvidence],
        },
        {
          id: "guest-guidance",
          category: "guests",
          title: "Ask how guest limits are applied",
          severity: "minor",
          provenance: "deterministic",
          explanation: "Clarify any guest policy before signing.",
          whyItMatters: "A written answer can prevent surprises.",
          evidence: [],
        },
      ],
      questionsToAsk: [
        "How should maintenance requests be submitted?",
        "Who handles emergency repairs?",
        "Does the notice period have a delivery requirement?",
        "Are there any charges not listed here?",
        "Can you provide the guest policy in writing?",
      ],
      nextSteps: [
        "Compare each grounded finding with the lease wording.",
        "Ask the listed questions before signing.",
        "Save the report with your lease records.",
      ],
      missingOrUnclear: ["The guest policy is not clearly stated."],
      disclaimer: "Educational information only; not legal advice.",
    },
    reportError: null,
  };
}

async function fulfillAnalysis(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(analysisResponse()),
  });
}

async function enterPastedLease(page: Page) {
  await page.goto("/");
  await page.getByRole("tab", { name: "Paste Text" }).click();
  await page.getByLabel("Lease text to analyze").fill(SOURCE_TEXT);
  await page.getByRole("button", { name: "Use pasted text" }).click();
  await expect(page.getByRole("heading", { name: "Confirm your lease" })).toBeVisible();
  await page.getByLabel(/I confirm this is a residential lease for a property in Texas/i).check();
}

async function openCompletedReview(page: Page) {
  await enterPastedLease(page);
  await page.getByRole("button", { name: "Continue to analysis" }).click();
  const heading = page.getByRole("heading", { name: "Your lease review" });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
}

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("audit remediation", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/analyze", fulfillAnalysis);
  });

  test("uses named navigation, mounts one panel, and preserves section state", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCompletedReview(page);

    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Report sections" })).toBeVisible();
    await expect(page.locator("[data-active-report-panel]")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Money and Fees" })).toHaveCount(0);

    await page.getByRole("button", { name: /Questions to ask/i }).click();
    await expect(page.getByRole("heading", { name: "Questions to Ask Before Signing" })).toBeFocused();
    await page.getByRole("button", { name: "Show 1 more" }).click();

    await page.getByRole("button", { name: /Money and fees/i }).click();
    await expect(page.getByRole("heading", { name: "Money and Fees" })).toBeFocused();
    await expect(page.getByRole("heading", { name: "Questions to Ask Before Signing" })).toHaveCount(0);

    await page.getByRole("button", { name: /Questions to ask/i }).click();
    await expect(page.getByRole("button", { name: "Show fewer" })).toBeVisible();
  });

  test("keeps mobile evidence inline until full-source review is requested", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCompletedReview(page);
    await page.getByLabel("Report section", { exact: true }).selectOption("terms");
    await expect(page.getByRole("heading", { name: "Terms to review" })).toBeFocused();

    const showEvidenceButton = page.getByRole("button", { name: "Show evidence" });
    await showEvidenceButton.scrollIntoViewIfNeeded();
    const documentYBefore = await page.evaluate(() => window.scrollY);
    await showEvidenceButton.click();
    await expect(page.locator("[data-finding-id='maintenance-clause'] q")).toContainText(MAINTENANCE_QUOTE);
    expect(await page.evaluate(() => window.scrollY)).toBe(documentYBefore);
    await expect(page.locator("[data-lease-text-viewer] [aria-label='Extracted lease text']")).toHaveCount(0);

    await page.getByLabel("Report section", { exact: true }).selectOption("summary");
    await page.getByLabel("Report section", { exact: true }).selectOption("terms");
    await expect(page.getByRole("button", { name: "Hide evidence" })).toBeVisible();

    const fullLeaseButton = page.getByRole("button", { name: "View in full lease" }).first();
    await fullLeaseButton.click();
    await expect(page.getByRole("heading", { name: "pasted-lease.txt" })).toBeFocused();
    const highlightedText = await page.locator("mark[data-bys-quote-highlight]").allTextContents();
    expect(highlightedText.join(" ").replace(/\s+/g, " ").trim()).toBe(MAINTENANCE_QUOTE);
    await expect(page.getByText("Evidence highlighted on page 1.")).toHaveText("Evidence highlighted on page 1.");
    expect(await page.evaluate(() => window.scrollX)).toBe(0);

    await page.getByRole("button", { name: /Back to Maintenance reporting duty/i }).click();
    await expect(fullLeaseButton).toBeFocused();
  });

  test("keeps report-first geometry stable at audited widths", async ({ page }) => {
    const viewports = [
      { width: 390, height: 844 },
      { width: 640, height: 900 },
      { width: 1023, height: 800 },
      { width: 1024, height: 800 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await openCompletedReview(page);

      const report = page.locator("[data-active-report-panel]");
      const viewer = page.locator("[data-lease-text-viewer]");
      const [reportBox, viewerBox] = await Promise.all([report.boundingBox(), viewer.boundingBox()]);
      expect(reportBox).not.toBeNull();
      expect(viewerBox).not.toBeNull();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

      if (viewport.width < 1280) {
        expect(viewerBox!.y).toBeGreaterThan(reportBox!.y + reportBox!.height);
      } else {
        expect(Math.abs(viewerBox!.height - viewport.height * 0.7)).toBeLessThanOrEqual(3);
        expect(viewerBox!.x).toBeGreaterThan(reportBox!.x + reportBox!.width);
        expect(reportBox!.width).toBeGreaterThanOrEqual(420);
      }
    }
  });

  test("cancellation is silent, preserves intake, and ignores the stale response", async ({ page }) => {
    await page.unroute("**/api/analyze", fulfillAnalysis);
    await page.route("**/api/analyze", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      await fulfillAnalysis(route);
    });

    await enterPastedLease(page);
    await page.getByRole("button", { name: "Continue to analysis" }).click();
    await page.getByRole("button", { name: "Cancel analysis" }).click();

    const continueButton = page.getByRole("button", { name: "Continue to analysis" });
    await expect(continueButton).toBeFocused();
    await expect(page.getByText("Analysis canceled. Your lease is still ready to review.")).toBeVisible();
    await expect(page.getByLabel(/I confirm this is a residential lease for a property in Texas/i)).toBeChecked();
    await page.waitForTimeout(1_200);
    await expect(page.getByRole("heading", { name: "Confirm your lease" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your lease review" })).toHaveCount(0);
  });

  test("focuses failure recovery and retries with the preserved lease", async ({ page }) => {
    await page.unroute("**/api/analyze", fulfillAnalysis);
    let requestCount = 0;
    await page.route("**/api/analyze", async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "NO_TEXT", message: "No extractable text was found in this PDF." } }),
        });
        return;
      }
      await fulfillAnalysis(route);
    });

    await enterPastedLease(page);
    await page.getByRole("button", { name: "Continue to analysis" }).click();
    const errorHeading = page.getByRole("heading", { name: "We couldn't finish analysis" });
    await expect(errorHeading).toBeFocused();
    await expect(page.getByText("No extractable text was found in this PDF.")).toBeVisible();
    await expect(page.getByLabel(/I confirm this is a residential lease for a property in Texas/i)).toBeChecked();
    await expectNoA11yViolations(page);

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "Your lease review" })).toBeFocused();
  });

  test("reports a timeout separately from user cancellation", async ({ page }) => {
    await page.unroute("**/api/analyze", fulfillAnalysis);
    let releaseResponse = () => {};
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route("**/api/analyze", async (route) => {
      await responseGate;
      await fulfillAnalysis(route).catch(() => undefined);
    });
    await page.clock.install();

    await enterPastedLease(page);
    await page.getByRole("button", { name: "Continue to analysis" }).click();
    await expect(page.getByRole("button", { name: "Cancel analysis" })).toBeVisible();
    await page.clock.fastForward(56_000);

    await expect(page.getByRole("heading", { name: "We couldn't finish analysis" })).toBeFocused();
    await expect(page.getByText(/Analysis took too long to finish/i)).toBeVisible();
    releaseResponse();
  });

  test("has no automatic accessibility violations across critical states", async ({ page }) => {
    await page.unroute("**/api/analyze", fulfillAnalysis);
    let releaseResponse = () => {};
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route("**/api/analyze", async (route) => {
      await responseGate;
      await fulfillAnalysis(route);
    });

    await page.goto("/");
    await expectNoA11yViolations(page);
    await page.getByRole("tab", { name: "Paste Text" }).click();
    await page.getByLabel("Lease text to analyze").fill(SOURCE_TEXT);
    await page.getByRole("button", { name: "Use pasted text" }).click();
    await page.getByLabel(/I confirm this is a residential lease for a property in Texas/i).check();
    await expectNoA11yViolations(page);

    await page.getByRole("button", { name: "Continue to analysis" }).click();
    await expect(page.getByRole("button", { name: "Cancel analysis" })).toBeVisible();
    await expectNoA11yViolations(page);
    releaseResponse();
    await expect(page.getByRole("heading", { name: "Your lease review" })).toBeVisible();
    await expectNoA11yViolations(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Report section", { exact: true }).selectOption("terms");
    await page.getByRole("button", { name: "Show evidence" }).click();
    await page.getByRole("button", { name: "View in full lease" }).click();
    await expectNoA11yViolations(page);
  });

  test("reduced motion removes interpolated progress and quote flashes", async ({ page }) => {
    await page.unroute("**/api/analyze", fulfillAnalysis);
    let releaseResponse = () => {};
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route("**/api/analyze", async (route) => {
      await responseGate;
      await fulfillAnalysis(route);
    });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await enterPastedLease(page);
    await page.getByRole("button", { name: "Continue to analysis" }).click();
    await expect(page.getByRole("button", { name: "Cancel analysis" })).toBeVisible();
    await expect(page.getByText(/^\d+%$/)).toHaveCount(0);
    expect(
      await page.locator(".animate-ping").first().evaluate((element) => getComputedStyle(element).animationName),
    ).toBe("none");

    releaseResponse();
    await expect(page.getByRole("heading", { name: "Your lease review" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Report section", { exact: true }).selectOption("terms");
    await page.getByRole("button", { name: "Show evidence" }).click();
    await page.getByRole("button", { name: "View in full lease" }).click();
    expect(
      await page
        .locator("mark[data-bys-quote-highlight]")
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
    ).toBe("none");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  });

  test("critical result controls meet the 44px product target", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCompletedReview(page);

    const shortControls = await page
      .locator("[aria-labelledby='completed-review-heading']")
      .locator("button:visible, select:visible, summary:visible")
      .evaluateAll((controls) =>
      controls
        .map((control) => {
          const rect = control.getBoundingClientRect();
          return { label: control.textContent?.trim() || control.getAttribute("aria-label"), width: rect.width, height: rect.height };
        })
        .filter((control) => control.width < 44 || control.height < 44),
    );

    expect(shortControls).toEqual([]);
  });
});
