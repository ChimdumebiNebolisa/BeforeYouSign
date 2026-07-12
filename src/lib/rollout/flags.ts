export function shouldUseModelContribution(): boolean {
  return process.env.BYS_MODEL_ENABLED !== "0";
}
