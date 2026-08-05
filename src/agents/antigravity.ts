import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeManagedFile, type ManagedWriteResult } from "../core/managedFiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflows = ["orch-explore", "orch-plan", "orch-execute", "orch-archive"];

export interface AgentAssetInstallResult {
  name: string;
  status: ManagedWriteResult;
}

function isLegacyAntigravityWorkflow(content: string, workflow: string): boolean {
  return (
    content.includes(`name: ${workflow}`) &&
    content.includes("OpenSpec is the ONLY source of truth") &&
    content.includes("ORCH TOKEN EFFICIENCY")
  );
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
