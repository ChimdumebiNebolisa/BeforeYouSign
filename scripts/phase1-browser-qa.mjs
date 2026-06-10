import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), "qa-screenshots", "phase1");

const BANNED = [
  /\brisk score\b/i,
  /\bred flag\b/i,
  /\bcritical\b/i,
  /\billegal\b/i,
  /\bvalid\b/i,
  /\benforceable\b/i,
  /\bunenforceable\b/i,
  /\bunsafe\b/i,
  /\blegal compliance\b/i,
  /\bAI lawyer\b/i,
  /\bshould sign\b/i,
  /\bshould not sign\b/i,
  /\bhidden traps\b/i,
  /\brisky\b/i,
  /\bHigh Risk\b/i,
  /\bTexas law requires\b/i,
  /\bincorrectly states\b/i,
  /\bAnalyse My Contract\b/i,
  /\$9\.99/,
];

const findings = [];
const snippets = [];

function note(label, ok, detail = "") {
  findings.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}${detail ? ` — ${detail}` : ""}`);
}

function captureSnippet(text, label) {
  snippets.push({ label, text: text.slice(0, 800) });
}

function checkBanned(text, context) {
  const hits = [];
  for (const re of BANNED) {
    if (re.test(text)) {
      // Ignore "valid" inside common lease phrases like "invalidate" or UI negations
      if (re.source.includes("valid") && !/\bvalid\b/i.test(text.replace(/\binvalid\w*/gi, ""))) continue;
      hits.push(re.source);
    }
  }
  if (hits.length) note(`${context}: banned terms`, false, hits.join(", "));
  else note(`${context}: no banned terms`, true);
  return hits.length === 0;
}

async function ensureDir() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function run() {
  await ensureDir();
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();

  // Landing — desktop
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: path.join(OUT, "01-landing-desktop.png"), fullPage: true });

  const body = await page.locator("body").innerText();
  captureSnippet(body, "landing-desktop");

  note(
    'Hero headline: "Understand your lease before you sign."',
    /Understand your lease\s*before you sign\./i.test(body),
  );
  note(
    'Subheadline: Texas residential lease copy',
    /Upload or paste a Texas residential lease to find key costs, deadlines, terms to review, and questions to ask\./i.test(
      body,
    ),
  );
  note(
    "Support note: Texas leases only",
    /Texas leases only for now\. City rules are not checked\. Educational only, not legal advice\./i.test(body),
  );
  note("Section: See what it finds", /See what it finds/i.test(body));
  note("Section: How it works", /How it works/i.test(body));
  note("Section: What it checks", /What it checks/i.test(body));
  note("Section: Texas renter check", /Texas renter check/i.test(body));
  note("Section: What it does not do", /What it does not do/i.test(body));
  note("Section: FAQ", /\bFAQ\b/i.test(body));
  note("Footer: BeforeYouSign", /Educational only, not legal advice/i.test(body));

  // Nav anchor links visible on desktop
  note("Nav: How it works link", await page.getByRole("link", { name: "How it works" }).first().isVisible());
  note("Nav: Texas leases only badge", /Texas leases only/i.test(body));

  // Review a lease scrolls to intake
  await page.getByRole("button", { name: "Review a lease" }).first().click();
  await page.waitForTimeout(600);
  const intakeInView = await page.locator("#review-intake").isVisible();
  note('"Review a lease" reveals intake area', intakeInView);

  // Run sample lease from hero
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run sample lease" }).click();
  await page.waitForTimeout(800);
  note(
    '"Run sample lease" switches to sample tab',
    await page.getByRole("tab", { name: "Sample" }).getAttribute("aria-selected") === "true",
  );

  // Tabs
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Paste Text" }).click();
  note("Paste Text tab shows textarea", await page.getByPlaceholder(/Paste your Texas residential lease/i).isVisible());
  await page.getByRole("tab", { name: "Sample" }).click();
  note(
    "Sample tab shows run button",
    await page.locator("#review-intake").getByRole("button", { name: "Run Sample Lease", exact: true }).isVisible(),
  );
  await page.getByRole("tab", { name: "Upload PDF" }).click();
  note("Upload PDF tab shows upload zone", /Click to upload or drag/i.test(await page.locator("#review-intake").innerText()));

  checkBanned(body, "landing desktop");

  // Sample lease full flow
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Sample" }).click();
  await page.locator("#review-intake").getByRole("button", { name: "Run Sample Lease", exact: true }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Continue to analysis/i }).waitFor({ state: "visible", timeout: 15000 });
  note("Sample lease reaches intake preview", /Lease intake/i.test(await page.locator("body").innerText()));
  await page.screenshot({ path: path.join(OUT, "02-intake-sample.png"), fullPage: true });

  await page.getByRole("button", { name: /Continue to analysis/i }).click();
  await page.getByText("Local landlord-tenant law was not checked").waitFor({ state: "visible", timeout: 180000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, "03-report-desktop.png"), fullPage: true });

  const reportBody = await page.locator("body").innerText();
  captureSnippet(reportBody, "report-desktop");
  note("Report carousel renders", await page.getByText("Summary").first().isVisible());
  note('Report shows "Review priority"', await page.getByText("Review priority", { exact: true }).first().isVisible());
  note('Report shows "Terms to review"', /Terms to review/i.test(reportBody));
  note("No numeric score in report UI", !/\(score\s|\bscore\s*:\s*\d|\bscore\s+\d/i.test(reportBody));
  checkBanned(reportBody, "report desktop");

  // Technical details
  await page.getByText("How this was analyzed").click();
  await page.waitForTimeout(500);
  const techText = await page.locator("details").filter({ hasText: "How this was analyzed" }).innerText();
  note("Technical details opens", /Pattern scan \(informational\)/i.test(techText));
  note("Technical: no numeric score", !/\(score\s|\bscore\s+\d/i.test(techText));
  await page.screenshot({ path: path.join(OUT, "04-technical-details.png"), fullPage: true });

  // Evidence highlight
  const flagBtn = page.locator("[data-finding-id]").first();
  if (await flagBtn.count()) {
    await flagBtn.click();
    await page.waitForTimeout(800);
    const markCount = await page.locator("mark").count();
    note("Evidence click highlights lease text", markCount > 0, `mark elements: ${markCount}`);
    await page.screenshot({ path: path.join(OUT, "05-evidence-highlight.png"), fullPage: true });
  } else {
    note("Evidence click highlights lease text", false, "no finding cards");
  }

  // Paste flow
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Paste Text" }).click();
  await page.getByPlaceholder(/Paste your Texas residential lease/i).fill(
    "Monthly rent: $1200 due on the 1st.\nSecurity deposit: $1200.\nLate fee: $50 per day.",
  );
  await page.getByRole("button", { name: /Use pasted text/i }).click();
  await page.getByText(/pasted-lease\.txt|Lease intake/i).first().waitFor({ timeout: 10000 });
  note("Paste text reaches intake preview", true);
  await page.screenshot({ path: path.join(OUT, "06-paste-intake.png"), fullPage: true });

  // PDF upload
  await page.goto(BASE, { waitUntil: "networkidle" });
  const pdfPath = path.join(process.cwd(), "public", "samples", "lease-standard.pdf");
  const fileInput = page.locator('#review-intake input[type="file"]');
  await fileInput.setInputFiles(pdfPath);
  await page.getByText(/Lease intake/i).waitFor({ timeout: 10000 });
  note("PDF upload reaches intake preview", true);
  await page.screenshot({ path: path.join(OUT, "07-pdf-intake.png"), fullPage: true });

  await browser.close();

  // Mobile
  const mobileBrowser = await chromium.launch({ headless: true });
  const mobile = await mobileBrowser.newContext({ ...devices["iPhone 13"] });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await mpage.screenshot({ path: path.join(OUT, "08-landing-mobile.png"), fullPage: true });

  const mobileBody = await mpage.locator("body").innerText();
  captureSnippet(mobileBody, "landing-mobile");
  note('Mobile hero headline', /Understand your lease\s*before you sign\./i.test(mobileBody));

  await mpage.getByRole("button", { name: "Open menu" }).click();
  await mpage.waitForTimeout(400);
  note(
    "Mobile hamburger opens menu",
    await mpage.locator("header").getByRole("link", { name: "FAQ" }).isVisible(),
  );
  await mpage.screenshot({ path: path.join(OUT, "09-mobile-menu.png"), fullPage: true });

  const overflow = await mpage.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  note("Mobile: no horizontal overflow", !overflow, overflow ? `scrollWidth > clientWidth` : "");

  await mpage.getByRole("tab", { name: "Sample" }).click();
  await mpage.locator("#review-intake").getByRole("button", { name: "Run Sample Lease", exact: true }).click();
  await mpage.waitForTimeout(2000);
  await mpage.getByRole("button", { name: /Continue to analysis/i }).click();
  await mpage.getByText("Local landlord-tenant law was not checked").waitFor({ state: "visible", timeout: 180000 });
  await mpage.waitForTimeout(1000);
  await mpage.screenshot({ path: path.join(OUT, "10-report-mobile.png"), fullPage: true });
  note(
    "Mobile report renders Review priority",
    await mpage.getByText("Review priority", { exact: true }).first().isVisible(),
  );
  checkBanned(mobileBody + (await mpage.locator("body").innerText()), "mobile");

  await mobileBrowser.close();

  const failed = findings.filter((f) => !f.ok);
  fs.writeFileSync(path.join(OUT, "qa-results.json"), JSON.stringify({ findings, snippets }, null, 2));
  console.log(`\nPhase 1 QA complete. ${findings.length - failed.length}/${findings.length} passed.`);
  console.log(`Screenshots: ${OUT}`);
  if (failed.length) {
    console.log("Failures:", failed.map((f) => `${f.label}${f.detail ? ` (${f.detail})` : ""}`).join("; "));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
