import type { ManagedWriteResult } from "../core/managedFiles.js";

export type ExecutionTier = "lightweight" | "default" | "strong";

export interface AgentCapabilities {
  readRepository: boolean;
  writeRepository: boolean;
  runCommands: boolean;
  supportsParallelWork: boolean;
  supportsSkills: boolean;
  supportsWorkflows: boolean;
  contextClass?: "small" | "medium" | "large";
  executionTiers?: ExecutionTier[];
}

export interface AgentAssetInstallResult {
  name: string;
  status: ManagedWriteResult;
}

export interface AgentAdapter {
  id: string;
  displayName: string;
  detect(cwd: string): Promise<boolean>;
  install(cwd: string): Promise<AgentAssetInstallResult[]>;
  update(cwd: string): Promise<AgentAssetInstallResult[]>;
  capabilities(): AgentCapabilities;
}
