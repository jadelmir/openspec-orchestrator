import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeManagedFile } from "../core/managedFiles.js";
import type { AgentAdapter, AgentAssetInstallResult, AgentCapabilities } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skills = ["orch-explore", "orch-plan", "orch-execute", "orch-archive"];

async function exists(target: string): Promise<boolean> {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isLegacyCodexSkill(content: string, skill: string): boolean {
  const title = `# ${skill.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")}`;
  return content.includes(title) && content.includes("OpenSpec is the ONLY source of truth") && content.includes("ORCH TOKEN EFFICIENCY");
}

export async function installCodexSkills(cwd: string): Promise<AgentAssetInstallResult[]> {
  const installed: AgentAssetInstallResult[] = [];
  for (const skill of skills) {
    const source = path.resolve(__dirname, "../agent-skills/codex", skill, "SKILL.md");
    const destination = path.join(cwd, ".codex", "skills", skill, "SKILL.md");
    const content = await readFile(source, "utf8");
    const status = await writeManagedFile(destination, content, {
      isLegacyOrchFile: (current) => isLegacyCodexSkill(current, skill)
    });
    installed.push({ name: skill, status });
  }
  return installed;
}

export class CodexAdapter implements AgentAdapter {
  id = "codex";
  displayName = "Codex";

  detect(cwd: string): Promise<boolean> {
    return exists(path.join(cwd, ".codex"));
  }

  install(cwd: string): Promise<AgentAssetInstallResult[]> {
    return installCodexSkills(cwd);
  }

  update(cwd: string): Promise<AgentAssetInstallResult[]> {
    return installCodexSkills(cwd);
  }

  capabilities(): AgentCapabilities {
    return {
      readRepository: true,
      writeRepository: true,
      runCommands: true,
      supportsParallelWork: true,
      supportsSkills: true,
      supportsWorkflows: false,
      contextClass: "large",
      executionTiers: []
    };
  }
}
