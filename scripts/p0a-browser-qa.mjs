import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), "qa-screenshots");
const BANNED = [
  /\bflag issues\b/i,
  /\bspot red flags\b/i,
  /\brisk level\b/i,
  /\bred flag\b/i,
  /\bcritical\b/i,
  /\billegal\b/i,
  /\bunsafe\b/i,
  /\bshould sign\b/i,
  /\bshould not sign\b/i,
  /\bscore\s*\d/i,
  /\(score\s/i,
];

const findings = [];
const snippets = [];

function note(label, ok, detail = "") {
  findings.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}${detail ? ` — ${detail}` : ""}`);
}

function captureSnippet(text, label) {
  snippets.push({ label, text: text.slice(0, 500) });
}

function checkBanned(text, context) {
  const hits = [];
  for (const re of BANNED) {
    if (re.test(text)) hits.push(re.source);
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

  // 1-3 Landing
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUT, "01-landing-desktop.png"), fullPage: true });

  const body = await page.locator("body").innerText();
  captureSnippet(body, "landing");
  note('Hero contains "highlight renter-facing terms"', /highlight renter-facing terms/i.test(body));
  note('Hero does NOT contain "flag issues"', !/flag issues/i.test(body));
  note('Feature card "Spot terms to review"', /Spot terms to review/i.test(body));
  note("Privacy block near upload", /BeforeYouSign is for educational lease review/i.test(body));
  note("Privacy continue line on upload CTA", /one-time analysis/i.test(body));
  checkBanned(body, "landing page");

  // 4 Sample lease
  await page.getByRole("button", { name: /Run Sample Lease/i }).click();
  await page.waitForTimeout(1500);
  const continueBtn = page.getByRole("button", { name: /Continue to analysis/i });
  await continueBtn.waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: path.join(OUT, "02-intake-sample.png"), fullPage: true });

  await continueBtn.click();
  await page.getByText(/Reviewing your lease|Analysis in progress/i).waitFor({ timeout: 10000 }).catch(() => {});
  await page
    .getByText("Local landlord-tenant law was not checked")
    .waitFor({ state: "visible", timeout: 180000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, "03-report-desktop.png"), fullPage: true });

  const reportBody = await page.locator("body").innerText();
  captureSnippet(reportBody, "report");
  note(
    'Report shows visible "Review priority" badge',
    await page.getByText("Review priority", { exact: true }).first().isVisible(),
  );
  note('Report shows "Terms to review"', /Terms to review/i.test(reportBody));
  note("Local law banner", /Local landlord-tenant law was not checked/i.test(reportBody));
  note("Fixed disclaimer", /Educational information only\. Not legal advice/i.test(reportBody));
  note("Severity uses mapped labels only", !/\bminor\b|\bmoderate\b|\bcritical\b/i.test(reportBody));
  note(
    "Mapped severity present when flags exist",
    /Lower attention|Moderate attention|Higher attention/i.test(reportBody) || !/Terms to review/i.test(reportBody),
  );
  checkBanned(reportBody, "report page");

  // 6-7 Technical details
  await page.getByText("How this was analyzed").click();
  await page.waitForTimeout(500);
  const techText = await page.locator("details").filter({ hasText: "How this was analyzed" }).innerText();
  captureSnippet(techText, "technical-details");
  note("Technical: Pattern scan label", /Pattern scan \(informational\)/i.test(techText));
  note("Technical: no numeric score", !/\(score\s|\bscore\s+\d/i.test(techText));
  await page.screenshot({ path: path.join(OUT, "04-technical-details.png"), fullPage: true });

  // 8 Evidence highlight
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

  // 9 Paste flow
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Paste Lease Text/i }).click();
  await page.getByRole("textbox").fill("Monthly rent: $1200 due on the 1st.\nSecurity deposit: $1200.\nLate fee: $50 per day.");
  await page.getByRole("button", { name: /Use pasted text/i }).click();
  await page.getByText(/pasted-lease\.txt|Lease intake/i).first().waitFor({ timeout: 10000 });
  note("Paste text reaches intake", true);
  await page.screenshot({ path: path.join(OUT, "06-paste-intake.png"), fullPage: true });

  // 10 PDF upload intake — use public sample PDF if exists
  await page.goto(BASE, { waitUntil: "networkidle" });
  const pdfPath = path.join(process.cwd(), "public", "samples", "lease-standard.pdf");
  if (fs.existsSync(pdfPath)) {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(pdfPath);
    await page.getByText(/Lease intake/i).waitFor({ timeout: 10000 });
    note("PDF upload reaches intake preview", true);
    await page.screenshot({ path: path.join(OUT, "07-pdf-intake.png"), fullPage: true });
  } else {
    note("PDF upload reaches intake preview", false, "sample PDF missing");
  }

  // 11 Mobile layout
  await browser.close();
  const mobileBrowser = await chromium.launch({ headless: true });
  const mobile = await mobileBrowser.newContext({ ...devices["iPhone 13"] });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE, { waitUntil: "networkidle" });
  await mpage.screenshot({ path: path.join(OUT, "08-landing-mobile.png"), fullPage: true });
  await mpage.getByRole("button", { name: /Run Sample Lease/i }).click();
  await mpage.waitForTimeout(2000);
  await mpage.getByRole("button", { name: /Continue to analysis/i }).click();
  await mpage
    .getByText("Local landlord-tenant law was not checked")
    .waitFor({ state: "visible", timeout: 180000 });
  await mpage.waitForTimeout(1000);
  await mpage.screenshot({ path: path.join(OUT, "09-report-mobile.png"), fullPage: true });
  const mobileBody = await mpage.locator("body").innerText();
  note(
    "Mobile report renders visible Review priority",
    await mpage.getByText("Review priority", { exact: true }).first().isVisible(),
  );
  checkBanned(mobileBody, "mobile report");
  await mobileBrowser.close();

  const failed = findings.filter((f) => !f.ok);
  fs.writeFileSync(path.join(OUT, "qa-results.json"), JSON.stringify({ findings, snippets }, null, 2));
  console.log(`\nQA complete. ${findings.length - failed.length}/${findings.length} passed. Screenshots in ${OUT}`);
  if (failed.length) {
    console.log("Failures:", failed.map((f) => f.label).join("; "));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
