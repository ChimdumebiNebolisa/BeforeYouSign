#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const port = process.env.SMOKE_PORT ?? "3102";
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextCli, "start", "-p", port, "-H", "127.0.0.1"], {
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
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    server.kill("SIGTERM");
  }
}

try {
  await waitForServer();
  const result = spawnSync(process.execPath, ["scripts/phase2-scan-smoke.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, PLAYWRIGHT_BASE_URL: baseUrl, BYS_MODEL_ENABLED: "0" },
    stdio: "inherit",
    windowsHide: true,
  });
  process.exit(result.status ?? 1);
} finally {
  stopServer();
}
