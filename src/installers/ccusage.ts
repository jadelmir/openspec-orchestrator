import { execCommand } from "../core/exec.js";
import { getCcusageStatus } from "../token/ccusage.js";

export async function installCcusage() {
  const result = await execCommand(
  "npm",
  ["install", "-g", "ccusage"],
  process.cwd(),
  true
);

  if (result.code !== 0) {
    return {
      success: false,
      error: result.stderr || "ccusage installation failed"
    };
  }

  const status = await getCcusageStatus();

  return {
    success: status.installed,
    error: status.installed
      ? undefined
      : "ccusage installed but could not be verified"
  };
}