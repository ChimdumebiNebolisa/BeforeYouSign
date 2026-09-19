export type StateGuidanceStatus = "supported" | "general_only";

export const STATE_OPTIONS = [
  { code: "AL", name: "Alabama", stateGuidance: "general_only" },
  { code: "AK", name: "Alaska", stateGuidance: "general_only" },
  { code: "AZ", name: "Arizona", stateGuidance: "general_only" },
  { code: "AR", name: "Arkansas", stateGuidance: "general_only" },
  { code: "CA", name: "California", stateGuidance: "general_only" },
  { code: "CO", name: "Colorado", stateGuidance: "general_only" },
  { code: "CT", name: "Connecticut", stateGuidance: "general_only" },
  { code: "DE", name: "Delaware", stateGuidance: "general_only" },
  { code: "FL", name: "Florida", stateGuidance: "general_only" },
  { code: "GA", name: "Georgia", stateGuidance: "general_only" },
  { code: "HI", name: "Hawaii", stateGuidance: "general_only" },
  { code: "ID", name: "Idaho", stateGuidance: "general_only" },
  { code: "IL", name: "Illinois", stateGuidance: "general_only" },
  { code: "IN", name: "Indiana", stateGuidance: "general_only" },
  { code: "IA", name: "Iowa", stateGuidance: "general_only" },
  { code: "KS", name: "Kansas", stateGuidance: "general_only" },
  { code: "KY", name: "Kentucky", stateGuidance: "general_only" },
  { code: "LA", name: "Louisiana", stateGuidance: "general_only" },
  { code: "ME", name: "Maine", stateGuidance: "general_only" },
  { code: "MD", name: "Maryland", stateGuidance: "general_only" },
  { code: "MA", name: "Massachusetts", stateGuidance: "general_only" },
  { code: "MI", name: "Michigan", stateGuidance: "general_only" },
  { code: "MN", name: "Minnesota", stateGuidance: "general_only" },
  { code: "MS", name: "Mississippi", stateGuidance: "general_only" },
  { code: "MO", name: "Missouri", stateGuidance: "general_only" },
  { code: "MT", name: "Montana", stateGuidance: "general_only" },
  { code: "NE", name: "Nebraska", stateGuidance: "general_only" },
  { code: "NV", name: "Nevada", stateGuidance: "general_only" },
  { code: "NH", name: "New Hampshire", stateGuidance: "general_only" },
  { code: "NJ", name: "New Jersey", stateGuidance: "general_only" },
  { code: "NM", name: "New Mexico", stateGuidance: "general_only" },
  { code: "NY", name: "New York", stateGuidance: "general_only" },
  { code: "NC", name: "North Carolina", stateGuidance: "general_only" },
  { code: "ND", name: "North Dakota", stateGuidance: "general_only" },
  { code: "OH", name: "Ohio", stateGuidance: "general_only" },
  { code: "OK", name: "Oklahoma", stateGuidance: "general_only" },
  { code: "OR", name: "Oregon", stateGuidance: "general_only" },
  { code: "PA", name: "Pennsylvania", stateGuidance: "general_only" },
  { code: "RI", name: "Rhode Island", stateGuidance: "general_only" },
  { code: "SC", name: "South Carolina", stateGuidance: "general_only" },
  { code: "SD", name: "South Dakota", stateGuidance: "general_only" },
  { code: "TN", name: "Tennessee", stateGuidance: "general_only" },
  { code: "TX", name: "Texas", stateGuidance: "supported" },
  { code: "UT", name: "Utah", stateGuidance: "general_only" },
  { code: "VT", name: "Vermont", stateGuidance: "general_only" },
  { code: "VA", name: "Virginia", stateGuidance: "general_only" },
  { code: "WA", name: "Washington", stateGuidance: "general_only" },
  { code: "WV", name: "West Virginia", stateGuidance: "general_only" },
  { code: "WI", name: "Wisconsin", stateGuidance: "general_only" },
  { code: "WY", name: "Wyoming", stateGuidance: "general_only" },
] as const satisfies ReadonlyArray<{
  code: string;
  name: string;
  stateGuidance: StateGuidanceStatus;
}>;

export type StateCode = (typeof STATE_OPTIONS)[number]["code"];

function findState(code: StateCode) {
  return STATE_OPTIONS.find((state) => state.code === code)!;
}

export function parseStateCode(value: unknown): StateCode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return STATE_OPTIONS.some((state) => state.code === normalized)
    ? (normalized as StateCode)
    : null;
}

export function getStateName(code: StateCode): string {
  return findState(code).name;
}

export function getStateGuidanceStatus(code: StateCode): StateGuidanceStatus {
  return findState(code).stateGuidance;
}

export function hasStateSpecificGuidance(code: StateCode): boolean {
  return getStateGuidanceStatus(code) === "supported";
}
