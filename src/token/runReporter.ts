import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { OrchRunMetrics, ToolRunMetric } from "./runMetrics.js";

export function formatToolStatus(metric: ToolRunMetric): string {
  switch (metric.status) {
    case "used": return "USED";
    case "skipped": return "SKIPPED";
    case "available": return "AVAILABLE";
    case "unavailable": return "UNAVAILABLE";
    case "failed": return "FAILED";
    default: return "UNKNOWN";
  }
}

function formatTokens(val?: number): string {
  if (val === undefined || !Number.isFinite(val)) return "not measured";
  return `${val.toLocaleString()} tokens`;
}

export function printToolReport(name: string, metric: ToolRunMetric): void {
  console.log(name);
  console.log(`Status: ${formatToolStatus(metric)}`);
  if (name === "ccusage") {
    if (metric.status === "available") {
      console.log("Tracking: session/day usage");
      console.log("Per-workflow usage: not directly attributable");
    } else if (metric.reason) console.log(`Reason: ${metric.reason}`);
    console.log("");
    return;
  }
  if (metric.reason) console.log(`Reason: ${metric.reason}`);
  if (metric.status === "used" && metric.savedTokens !== undefined) console.log(`Saved: ${formatTokens(metric.savedTokens)}`);
  if (metric.status === "failed" && metric.error) console.log(`Error: ${metric.error}`);
  console.log("");
}

export function printRunReport(metrics: OrchRunMetrics): void {
  console.log("\n🧠 ORCH TOKEN EFFICIENCY");
  console.log("────────────────────────────────");
  console.log(`Workflow: ${metrics.workflow}\n`);

  printToolReport("RTK", metrics.rtk);
  printToolReport("Repomix", metrics.repomix);
  printToolReport("LLMLingua", metrics.llmlingua);
  printToolReport("ccusage", metrics.ccusage);

  if (metrics.routing?.length) {
    console.log("Routing");
    for (const route of metrics.routing) {
      console.log(`- ${route.workUnitId} (${route.sourceTaskRef})`);
      console.log(`  Agent: ${route.agentId}`);
      console.log(`  Tier: ${route.executionTier}${route.tierEnforced ? "" : ` (requested ${route.requestedTier}, advisory)`}`);
      console.log(`  Context: ${route.contextStrategy}`);
      console.log(`  Parallel: ${route.parallelGroup ?? "sequential"}`);
      console.log(`  Usage: input ${formatTokens(route.inputTokens)}, output ${formatTokens(route.outputTokens)}`);
      console.log(`  Reason: ${route.reasons.join(" ")}`);
    }
    console.log("");
  }

  console.log("Context");
  console.log(`Before: ${formatTokens(metrics.contextBeforeTokens)}`);
  console.log(`After:  ${formatTokens(metrics.contextAfterTokens)}`);
  if (metrics.contextBeforeTokens !== undefined && metrics.contextAfterTokens !== undefined) {
    const saved = Math.max(0, metrics.contextBeforeTokens - metrics.contextAfterTokens);
    const reduction = metrics.contextBeforeTokens > 0 ? (saved / metrics.contextBeforeTokens) * 100 : 0;
    console.log(`Saved:  ${formatTokens(saved)}`);
    console.log(`Reduction: ${reduction.toFixed(1)}%`);
  }

  console.log("\n────────────────────────────────");
  console.log(`Run saved:     ${formatTokens(metrics.runSavedTokens)}`);
  console.log(`Project saved: ${formatTokens(metrics.projectSavedTokens)}\n`);
  const anyUsed = metrics.rtk.status === "used" || metrics.repomix.status === "used" || metrics.llmlingua.status === "used";
  console.log(anyUsed ? "🧠 Token efficiency was used" : "ℹ️ No token optimization was required for this run.");
}

export async function saveRunState(cwd = process.cwd(), metrics: OrchRunMetrics): Promise<void> {
  const orchDir = path.join(cwd, ".orch");
  await mkdir(orchDir, { recursive: true });
  await writeFile(path.join(orchDir, "run-state.json"), JSON.stringify(metrics, null, 2) + "\n", "utf8");
}

export async function loadRunState(cwd = process.cwd()): Promise<OrchRunMetrics | null> {
  try {
    const data = JSON.parse(await readFile(path.join(cwd, ".orch", "run-state.json"), "utf8"));
    return data as OrchRunMetrics;
  } catch {
    return null;
  }
}
