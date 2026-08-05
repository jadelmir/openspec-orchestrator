import { getCodexDailyUsageJson } from "../token/ccusage.js";

export async function tokensCommand() {
  const result = await getCodexDailyUsageJson();

  if (result.code !== 0) {
    console.error(result.stderr || "Unable to read Codex usage.");
    process.exitCode = result.code;
    return;
  }

  try {
    const parsed = JSON.parse(result.stdout);
    console.log(JSON.stringify(parsed, null, 2));
  } catch {
    console.log(result.stdout);
  }
}
