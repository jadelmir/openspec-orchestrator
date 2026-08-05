import { commandExists, execCommand } from "../core/exec.js";

export async function getCcusageStatus() {
  const status = await commandExists(
    "npx",
    ["--yes", "ccusage@latest", "--version"]
  );

  return {
    installed: status.installed,
    version: status.version,
    error: status.error,
    via: status.installed ? "npx" : undefined
  };
}

export async function getCodexDailyUsageJson(
  cwd = process.cwd()
) {
  return execCommand(
    "npx",
    [
      "--yes",
      "ccusage@latest",
      "codex",
      "daily",
      "--json"
    ],
    cwd
  );
}