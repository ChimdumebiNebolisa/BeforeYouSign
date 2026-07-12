import { describe, expect, it } from "vitest";

import { getSecurityHeaders } from "@/lib/security/headers";

function headerValue(headers: ReturnType<typeof getSecurityHeaders>, key: string): string {
  return headers.find((header) => header.key === key)?.value ?? "";
}

describe("security headers", () => {
  it("returns the baseline browser protections", () => {
    const headers = getSecurityHeaders();

    expect(headerValue(headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "X-Frame-Options")).toBe("DENY");
    expect(headerValue(headers, "Permissions-Policy")).toContain("camera=()");
  });

  it("keeps production CSP same-origin and excludes unsafe eval", () => {
    const csp = headerValue(getSecurityHeaders(false), "Content-Security-Policy");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).toContain("frame-src 'self' blob:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("generativelanguage.googleapis.com");
  });

  it("allows eval only for the local Next development runtime", () => {
    const csp = headerValue(getSecurityHeaders(true), "Content-Security-Policy");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });
});
