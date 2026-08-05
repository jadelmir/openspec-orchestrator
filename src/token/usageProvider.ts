import { getCcusageStatus, getCodexDailyUsageJson } from "./ccusage.js";

export interface UsageProviderStatus {
  id: string;
  label: string;
  available: boolean;
  version?: string;
  detail?: string;
}

export interface UsageProvider {
  id: string;
  label: string;
  status(): Promise<UsageProviderStatus>;
  readDailyUsage(cwd?: string): Promise<{ code: number; stdout: string; stderr: string }>;
}

export const ccusageProvider: UsageProvider = {
  id: "ccusage-codex",
  label: "ccusage (Codex)",
  async status() {
    const status = await getCcusageStatus();
    return {
      id: this.id,
      label: this.label,
      available: status.installed,
      version: status.version,
      detail: status.error
    };
  },
  readDailyUsage(cwd) {
    return getCodexDailyUsageJson(cwd);
  }
};

export function getDefaultUsageProvider(): UsageProvider {
  return ccusageProvider;
}
