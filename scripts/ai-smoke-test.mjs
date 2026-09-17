#!/usr/bin/env node

if (process.env.AI_SMOKE_ENABLED !== "1") {
  console.log("AI smoke test skipped. Set AI_SMOKE_ENABLED=1 to run a real Gemini check.");
  process.exit(0);
}

const endpoint = process.env.AI_SMOKE_URL ?? "http://127.0.0.1:3000/api/analyze";
const leaseText =
  "Monthly rent is $1,450 due on the first of each month. Security deposit is $1,450. Late fee is $75 after a three-day grace period.";

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ leaseText, fileName: "ai-smoke.txt" }),
});

if (!response.ok) {
  throw new Error(`AI smoke request failed with HTTP ${response.status}.`);
}

const body = await response.json();
if (body?.ok !== true || body.mode !== "model_grounded") {
  throw new Error(`AI smoke did not produce a grounded model response (mode: ${String(body?.mode)}).`);
}

if ((body.groundingSummary?.groundedClaims ?? 0) < 1) {
  throw new Error("AI smoke response did not contain a grounded claim.");
}

console.log("AI smoke test passed: Gemini returned an evidence-grounded hybrid report.");
