import { createDefaultAgentRegistry } from "../agents/defaultRegistry.js";

export async function updateCommand(cwd = process.cwd()) {
  console.log("ORCH Update");
  console.log("────────────────────────────────");
  console.log("Refreshing Orch-managed agent assets only.");

  const registry = createDefaultAgentRegistry();
  const integrations = await registry.updateAll(cwd);
  const allResults = integrations.flatMap((entry) => entry.results);

  for (const { adapter, results } of integrations) {
    for (const item of results) {
      console.log(`${icon(item.status)} ${adapter.displayName} ${item.name}: ${label(item.status)}`);
    }
  }

  if (allResults.some((item) => item.status === "skipped-user-file")) {
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
