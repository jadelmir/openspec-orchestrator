import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeManagedFile, type ManagedWriteResult } from "../core/managedFiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skills = ["orch-explore", "orch-plan", "orch-execute", "orch-archive"];

export interface AgentAssetInstallResult {
  name: string;
  status: ManagedWriteResult;
}

function isLegacyCodexSkill(content: string, skill: string): boolean {
  const title = `# ${skill
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")}`;

  return (
    content.includes(title) &&
    content.includes("OpenSpec is the ONLY source of truth") &&
    content.includes("ORCH TOKEN EFFICIENCY")
  );
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
