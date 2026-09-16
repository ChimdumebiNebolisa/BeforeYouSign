import { afterEach, describe, expect, it, vi } from "vitest";
import { practiceAccess } from "@/lib/practice/config";

describe("practice access controls", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays denied when the practice gate is disabled", () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("BYS_OPERATOR_TOKEN", "operator-token");
    vi.stubEnv("BYS_PRACTICE_ENABLED", "0");

    expect(practiceAccess("operator-token")).toMatchObject({
      allowed: false,
      reason: "Practice is disabled.",
    });
  });

  it("requires the configured operator token and valid bounded settings", () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("BYS_OPERATOR_TOKEN", "operator-token");
    vi.stubEnv("BYS_PRACTICE_ENABLED", "1");
    vi.stubEnv("BYS_PRACTICE_MAX_SECONDS", "120");

    expect(practiceAccess("wrong-token").allowed).toBe(false);
    expect(practiceAccess("operator-token").allowed).toBe(true);
  });

  it("rejects unsupported models and unsafe duration limits", () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("BYS_OPERATOR_TOKEN", "operator-token");
    vi.stubEnv("BYS_PRACTICE_ENABLED", "1");
    vi.stubEnv("BYS_PRACTICE_MODEL", "unsupported-model");

    expect(practiceAccess("operator-token")).toMatchObject({
      allowed: false,
      reason: "The configured practice model is not supported.",
    });

    vi.stubEnv("BYS_PRACTICE_MODEL", "gpt-realtime-2.1-mini");
    vi.stubEnv("BYS_PRACTICE_MAX_SECONDS", "601");
    expect(practiceAccess("operator-token")).toMatchObject({
      allowed: false,
      reason: "The practice time limit is invalid.",
    });
  });
});
