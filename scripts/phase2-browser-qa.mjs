import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), "qa-screenshots", "phase2");

const findings = [];
function note(label, ok, detail = "") {
  findings.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}${detail ? ` — ${detail}` : ""}`);
}

async function runSampleToReport(page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Sample" }).click();
  await page.locator("#review-intake").getByRole("button", { name: "Run Sample Lease", exact: true }).click();
  await page.getByRole("button", { name: /Continue to analysis/i }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Continue to analysis/i }).click();
  await page.getByText("Local landlord-tenant law was not checked").waitFor({ state: "visible", timeout: 180000 });
}

async function goToTexasSlide(page) {
  await page.getByRole("button", { name: "Go to Texas renter check" }).click();
  const reportSection = page
    .locator("section.rounded-lg")
    .filter({ has: page.getByRole("heading", { name: "Texas renter check" }) });
  await reportSection.waitFor({ state: "visible", timeout: 10000 });
  return reportSection;
}

async function testTexasEvidenceHighlight(page) {
  const reportSection = await goToTexasSlide(page);
  const texasCard = reportSection.locator("[data-finding-id^='texas-']").first();
  const cardCount = await texasCard.count();
  if (!cardCount) {
    note("Texas card evidence highlight", false, "no texas cards");
    return;
  }

  await texasCard.waitFor({ state: "visible" });
  const slideText = await reportSection.innerText();
  const cardText = await texasCard.innerText();
  const marksBefore = await page.locator("mark").count();

  await texasCard.locator("button").first().click();

  try {
    await page.waitForFunction(
      (before) => document.querySelectorAll("mark").length > before,
      marksBefore,
      { timeout: 8000 },
    );
  } catch {
    // fall through to diagnostics
  }

  const marksAfter = await page.locator("mark").count();
  const viewerSnippet = await page
    .locator("mark")
    .first()
    .innerText()
    .catch(async () => {
      const panel = page.getByText("Extracted text").first();
      if (await panel.isVisible().catch(() => false)) {
        return panel.locator("xpath=ancestor::section[1]").innerText().catch(() => "");
      }
      return "";
    });

  const ok = marksAfter > marksBefore;
  note("Texas card evidence highlight", ok, `before=${marksBefore} after=${marksAfter}`);

  if (!ok) {
    console.log("Diagnostics — Texas evidence highlight:");
    console.log(`  active slide: ${slideText.slice(0, 280).replace(/\s+/g, " ")}`);
    console.log(`  clicked card: ${cardText.slice(0, 200).replace(/\s+/g, " ")}`);
    console.log(`  marks before click: ${marksBefore}`);
    console.log(`  marks after click: ${marksAfter}`);
    console.log(`  lease viewer snippet: ${String(viewerSnippet).slice(0, 280).replace(/\s+/g, " ")}`);
  }

  await page.screenshot({ path: path.join(OUT, "02-texas-evidence.png"), fullPage: true });
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await runSampleToReport(page);

  const reportSection = await goToTexasSlide(page);
  const body = await reportSection.innerText();

  note("Texas renter check section visible", await reportSection.isVisible());
  note("Section note present", /These notes use statewide Texas renter resources/i.test(body));
  note("Security deposit topic", /Security deposit/i.test(body));
  note("Why it matters copy", /This affects your deposit/i.test(body));
  note("Source title present", /Texas Property Code Chapter 92/i.test(body));
  note("Source section label", /Security deposits and return of deposit/i.test(body));
  note("Statewide source note", /Statewide Texas source\. City rules are not checked\./i.test(body));
  note("Checklist download button", await page.getByRole("button", { name: "Download question checklist" }).isVisible());

  await page.getByRole("button", { name: "Go to Summary" }).click();
  await page.waitForTimeout(400);
  const summaryBody = await page.locator("body").innerText();
  note("Review priority still present", /Review priority/i.test(summaryBody));
  note("Terms to review still present", /Terms to review/i.test(summaryBody));
  note("No numeric score", !/\(score\s|\bscore\s*:\s*\d/i.test(summaryBody));

  const banned = /risk score|red flag|\billegal\b|legal compliance|AI lawyer|hidden traps|High Risk|Texas law requires|enforceable/i;
  note("No banned wording", !banned.test(body + summaryBody));

  await goToTexasSlide(page);
  await page.screenshot({ path: path.join(OUT, "01-texas-renter-check.png"), fullPage: true });

  await testTexasEvidenceHighlight(page);

  await page.getByText("How this was analyzed").click();
  note("Technical details opens", await page.getByText("Pattern scan (informational)").isVisible());

  await browser.close();

  const mobileBrowser = await chromium.launch({ headless: true });
  const mpage = await mobileBrowser.newPage({ ...devices["iPhone 13"] });
  await runSampleToReport(mpage);
  const mobileSection = mpage
    .locator("section.rounded-lg")
    .filter({ has: mpage.getByRole("heading", { name: "Texas renter check" }) });
  await mpage.screenshot({ path: path.join(OUT, "03-mobile-texas.png"), fullPage: true });
  note("Mobile Texas section", await mobileSection.isVisible());
  await mobileBrowser.close();

  const failed = findings.filter((f) => !f.ok);
  fs.writeFileSync(path.join(OUT, "qa-results.json"), JSON.stringify({ findings }, null, 2));
  console.log(`\nPhase 2 QA: ${findings.length - failed.length}/${findings.length} passed`);
  if (failed.length) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
