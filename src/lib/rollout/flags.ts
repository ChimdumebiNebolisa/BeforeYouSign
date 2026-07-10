export const ROLLOUT_FLAGS = {
  analysisVersion: Number(process.env.BYS_ANALYSIS_VERSION ?? "2"),
  modelEnabled: process.env.BYS_MODEL_ENABLED !== "0",
  ocrEnabled: process.env.BYS_OCR_ENABLED === "1",
  asyncEnabled: process.env.BYS_ASYNC_ENABLED === "1",
  recoveryEnabled: process.env.BYS_RECOVERY_ENABLED === "1",
} as const;

export function shouldUseModelContribution(): boolean {
  return ROLLOUT_FLAGS.modelEnabled;
}

export function shouldOfferAsyncJobs(): boolean {
  return ROLLOUT_FLAGS.asyncEnabled;
}

export function shouldOfferRecovery(): boolean {
  return ROLLOUT_FLAGS.recoveryEnabled;
}
