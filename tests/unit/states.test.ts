import { describe, expect, it } from "vitest";

import {
  getStateGuidanceStatus,
  getStateName,
  parseStateCode,
  STATE_OPTIONS,
} from "@/lib/jurisdiction/states";

describe("state jurisdiction options", () => {
  it("provides all 50 states and marks only Texas as supported", () => {
    expect(STATE_OPTIONS).toHaveLength(50);
    expect(STATE_OPTIONS.filter((state) => state.stateGuidance === "supported")).toEqual([
      { code: "TX", name: "Texas", stateGuidance: "supported" },
    ]);
  });

  it("normalizes valid state codes and rejects unknown values", () => {
    expect(parseStateCode(" ca ")).toBe("CA");
    expect(parseStateCode("not-a-state")).toBeNull();
    expect(getStateName("CA")).toBe("California");
    expect(getStateGuidanceStatus("CA")).toBe("general_only");
    expect(getStateGuidanceStatus("TX")).toBe("supported");
  });
});
