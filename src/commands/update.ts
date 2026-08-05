import { installCodexSkills } from "../agents/codex.js";
import { installAntigravityWorkflows } from "../agents/antigravity.js";

export async function updateCommand(cwd = process.cwd()) {
  console.log("ORCH Update");
  console.log("────────────────────────────────");
  console.log("Refreshing Orch-managed agent assets only.");

  const codex = await installCodexSkills(cwd);
  const antigravity = await installAntigravityWorkflows(cwd);

  for (const item of codex) {
    console.log(`${icon(item.status)} Codex ${item.name}: ${label(item.status)}`);
  }

  for (const item of antigravity) {
    console.log(`${icon(item.status)} Antigravity /${item.name}: ${label(item.status)}`);
  }

  const skipped = [...codex, ...antigravity].filter((item) => item.status === "skipped-user-file");
  if (skipped.length) {
    console.log("");
    console.log("⚠️ User-authored files were preserved. Orch only updates files it can safely identify as Orch-managed.");
  }
}

function icon(status: string): string {
  if (status === "created" || status === "updated" || status === "adopted-legacy") return "✅";
  if (status === "unchanged") return "ℹ️";
  return "⚠️";
}

function label(status: string): string {
  if (status === "adopted-legacy") return "adopted legacy Orch file and updated";
  return status;
}
