import { existsSync } from "node:fs";
import path from "node:path";

export async function statusCommand(cwd = process.cwd()) {
  const config = path.join(cwd, ".orch", "config.json");
  console.log("ORCH Status");
  console.log("────────────────────────────────");
  console.log(`Project: ${cwd}`);
  console.log(`Orch initialized: ${existsSync(config) ? "yes" : "no"}`);
  console.log("Source of truth: OpenSpec");
}
