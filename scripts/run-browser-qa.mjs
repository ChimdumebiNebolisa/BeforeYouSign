#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const port = process.env.QA_PORT ?? "3100";
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const outputDir = path.resolve(
  process.env.QA_OUTPUT_DIR ?? path.join(os.tmpdir(), `beforeyousign-qa-${Date.now()}`),
);
const requestedScripts = process.argv.slice(2);
const qaScripts = requestedScripts.length
  ? requestedScripts
  : ["scripts/smoke-test.mjs", "scripts/phase1-browser-qa.mjs", "scripts/phase2-browser-qa.mjs"];
const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextCli, "start"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: port, BYS_MODEL_ENABLED: "0" },
  stdio: "inherit",
  windowsHide: true,
});

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

function stopServer() {
  if (server.killed) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
  } else {
    server.kill("SIGTERM");
  }
}

try {
  await waitForServer();
  for (const script of qaScripts) {
    const scriptOutputDir = path.join(outputDir, path.basename(script, ".mjs"));
    const result = spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      env: { ...process.env, PLAYWRIGHT_BASE_URL: baseUrl, QA_OUTPUT_DIR: scriptOutputDir },
      stdio: "inherit",
      windowsHide: true,
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
} finally {
  stopServer();
}

console.log(`Browser QA artifacts: ${outputDir}`);
