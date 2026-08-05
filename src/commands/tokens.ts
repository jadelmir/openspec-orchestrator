import { getDefaultUsageProvider } from "../token/usageProvider.js";

export async function tokensCommand(cwd = process.cwd()) {
  const provider = getDefaultUsageProvider();
  const status = await provider.status();

  if (!status.available) {
    console.error(`${status.label} is unavailable.${status.detail ? ` ${status.detail}` : ""}`);
    process.exitCode = 1;
    return;
  }

  const result = await provider.readDailyUsage(cwd);

  if (result.code !== 0) {
    console.error(result.stderr || `Unable to read usage from ${provider.label}.`);
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
