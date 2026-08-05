import { installCodexSkills } from "../agents/codex.js";
import { installAntigravityWorkflows } from "../agents/antigravity.js";

export async function updateCommand(cwd = process.cwd()) {
  console.log("ORCH Update");
  console.log("────────────────────────────────");
  console.log("Refreshing Orch-managed agent assets only.");

  const codex = await installCodexSkills(cwd);
  const antigravity = await installAntigravityWorkflows(cwd);

  for (const item of codex) {
    console.log(`${icon(item.status)} Codex ${item.name}: ${item.status}`);
  }

  for (const item of antigravity) {
    console.log(`${icon(item.status)} Antigravity /${item.name}: ${item.status}`);
  }

  const skipped = [...codex, ...antigravity].filter((item) => item.status === "skipped-user-file");
  if (skipped.length) {
    console.log("");
    console.log("⚠️ User-authored files were preserved. Orch only updates files carrying its managed marker.");
  }
}

function icon(status: string): string {
  if (status === "created" || status === "updated") return "✅";
  if (status === "unchanged") return "ℹ️";
  return "⚠️";
}
