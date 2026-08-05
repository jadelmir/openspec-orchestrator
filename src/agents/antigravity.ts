import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflows = [
  "orch-explore",
  "orch-plan",
  "orch-execute",
  "orch-archive"
];

export async function installAntigravityWorkflows(
  cwd: string
): Promise<string[]> {
  const destinationDir = path.join(
    cwd,
    ".agents",
    "workflows"
  );

  await mkdir(destinationDir, {
    recursive: true
  });

  const installed: string[] = [];

  for (const workflow of workflows) {
    const source = path.resolve(
      __dirname,
      "../agent-workflows/antigravity",
      `${workflow}.md`
    );

    const destination = path.join(
      destinationDir,
      `${workflow}.md`
    );

    await copyFile(source, destination);

    installed.push(workflow);
  }

  return installed;
}
