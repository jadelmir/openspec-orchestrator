import { execCommand } from "../core/exec.js";
import { getRepomixStatus } from "../token/repomix.js";

export async function installRepomix() {
  const result = await execCommand(
  "npm",
  ["install", "-g", "repomix"],
  process.cwd(),
  true
);

  if (result.code !== 0) {
    return {
      success: false,
      error: result.stderr || "Repomix installation failed"
    };
  }

  const status = await getRepomixStatus();

  return {
    success: status.installed,
    error: status.installed
      ? undefined
      : "Repomix installed but could not be verified"
  };
}