import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeManagedFile } from "../core/managedFiles.js";
import type { AgentAdapter, AgentAssetInstallResult, AgentCapabilities } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workflows = ["orch-explore", "orch-plan", "orch-execute", "orch-archive"];

async function exists(target: string): Promise<boolean> {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isLegacyAntigravityWorkflow(content: string, workflow: string): boolean {
  return content.includes(`name: ${workflow}`) && content.includes("OpenSpec is the ONLY source of truth") && content.includes("ORCH TOKEN EFFICIENCY");
}

export async function installAntigravityWorkflows(cwd: string): Promise<AgentAssetInstallResult[]> {
  const installed: AgentAssetInstallResult[] = [];
  for (const workflow of workflows) {
    const source = path.resolve(__dirname, "../agent-workflows/antigravity", `${workflow}.md`);
    const destination = path.join(cwd, ".agents", "workflows", `${workflow}.md`);
    const content = await readFile(source, "utf8");
    const status = await writeManagedFile(destination, content, {
      isLegacyOrchFile: (current) => isLegacyAntigravityWorkflow(current, workflow)
    });
    installed.push({ name: workflow, status });
  }
  return installed;
}

export class AntigravityAdapter implements AgentAdapter {
  id = "antigravity";
  displayName = "Antigravity";

  detect(cwd: string): Promise<boolean> {
    return exists(path.join(cwd, ".agents"));
  }

  install(cwd: string): Promise<AgentAssetInstallResult[]> {
    return installAntigravityWorkflows(cwd);
  }

  update(cwd: string): Promise<AgentAssetInstallResult[]> {
    return installAntigravityWorkflows(cwd);
  }

  capabilities(): AgentCapabilities {
    return {
      readRepository: true,
      writeRepository: true,
      runCommands: true,
      supportsParallelWork: true,
      supportsSkills: false,
      supportsWorkflows: true,
      contextClass: "large",
      executionTiers: []
    };
  }
}
