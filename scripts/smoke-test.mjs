import { chromium } from "playwright";

const BASE = "http://localhost:3000";

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
  /\bcoming next\b/i,
];

const findings = [];
function note(label, ok, detail = "") {
  findings.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}${detail ? ` — ${detail}` : ""}`);
}

function checkBanned(text, context) {
  const hits = [];
  for (const re of BANNED) {
    if (re.test(text)) {
      if (re.source.includes("valid") && !/\bvalid\b/i.test(text.replace(/\binvalid\w*/gi, ""))) continue;
      hits.push(re.source);
    }
  }
  if (hits.length) note(`No banned wording (${context})`, false, hits.join(", "));
  else note(`No banned wording (${context})`, true);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE, { waitUntil: "networkidle" });
  note("Landing loads", page.url().includes("localhost:3000"));
  const landingBody = await page.locator("body").innerText();
  note("Landing Texas renter section", /Texas renter check/i.test(landingBody));
  note("Landing OCR warning", /Scanned image-only PDFs may not extract correctly/i.test(landingBody));
  checkBanned(landingBody, "landing");

  await page.getByRole("tab", { name: "Sample" }).click();
  await page.locator("#review-intake").getByRole("button", { name: "Run Sample Lease", exact: true }).click();
  await page.getByRole("button", { name: /Continue to analysis/i }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Continue to analysis/i }).click();
  await page.getByText("Local landlord-tenant law was not checked").waitFor({ state: "visible", timeout: 180000 });

  const reportBody = await page.locator("body").innerText();
  note("Report appears", /Review priority/i.test(reportBody));
  note("Texas renter check in report", /Texas renter check/i.test(reportBody));
  note("Checklist download button", await page.getByRole("button", { name: "Download question checklist" }).isVisible());
  checkBanned(reportBody, "report");

  await browser.close();

  const failed = findings.filter((f) => !f.ok);
  console.log(`\nSmoke test: ${findings.length - failed.length}/${findings.length} passed`);
  if (failed.length) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
