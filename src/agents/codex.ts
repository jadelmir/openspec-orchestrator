import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skills = [
  "orch-explore",
  "orch-plan",
  "orch-execute",
  "orch-archive"
];

export async function installCodexSkills(
  cwd: string
): Promise<string[]> {
  const installed: string[] = [];

  for (const skill of skills) {
    const source = path.resolve(
      __dirname,
      "../agent-skills/codex",
      skill,
      "SKILL.md"
    );

    const destinationDir = path.join(
      cwd,
      ".codex",
      "skills",
      skill
    );

    await mkdir(destinationDir, {
      recursive: true
    });

    await copyFile(
      source,
      path.join(destinationDir, "SKILL.md")
    );

    installed.push(skill);
  }

  return installed;
}