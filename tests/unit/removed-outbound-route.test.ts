import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/call-landlord/route";

const originalEnv = { ...process.env };

function request(body: unknown) {
  return new NextRequest("http://localhost/api/call-landlord", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("removed outbound route", () => {
  it("rejects legacy POST requests without making provider requests even with old settings", async () => {
    process.env.BYS_CALLE_LIVE_ENABLED = "1";
    process.env.CALLE_API_KEY = "scoped-test-only";
    process.env.BYS_CALLE_ALLOWED_NUMBERS = "+12025550123";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(request({ mode: "live", phone: "+12025550123", confirmed: true }));
    expect(response.status).toBe(410);
    expect((await response.json()).error).toContain("removed");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects legacy GET result retrieval without making provider requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await GET(new NextRequest("http://localhost/api/call-landlord?callId=call_123"));
    expect(response.status).toBe(410);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
