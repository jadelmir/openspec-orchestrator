import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { commandExists } from "../core/exec.js";
import { createDefaultAgentRegistry } from "../agents/defaultRegistry.js";
import { getRtkStatus } from "../token/rtk.js";
import { getRepomixStatus } from "../token/repomix.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";
import { getDefaultUsageProvider } from "../token/usageProvider.js";

export async function statusCommand(cwd = process.cwd()) {
  const configPath = path.join(cwd, ".orch", "config.json");
  const openspecDir = path.join(cwd, "openspec");

  let configState = "missing";
  if (existsSync(configPath)) {
    try { JSON.parse(readFileSync(configPath, "utf8")); configState = "valid"; }
    catch { configState = "invalid"; }
  }

  const openspecCli = await commandExists("openspec", ["--version"]);
  const registry = createDefaultAgentRegistry();
  const detected = new Set((await registry.detected(cwd)).map((adapter) => adapter.id));
  const rtk = await getRtkStatus();
  const repomix = await getRepomixStatus();
  const llm = getLLMLinguaStatus();
  const usage = await getDefaultUsageProvider().status();

  console.log("ORCH STATUS");
  console.log("────────────────────────────────");
  console.log(`Project        ${cwd}`);
  console.log(`Config         ${configState === "valid" ? "✅ valid" : configState === "invalid" ? "❌ invalid" : "⚠️ missing"}`);
  console.log(`OpenSpec CLI   ${openspecCli.installed ? "✅ available" : "⚠️ unavailable"}`);
  console.log(`OpenSpec proj  ${existsSync(openspecDir) ? "✅ initialized" : "⚠️ not initialized"}`);
  console.log("\nIntegrations");
  for (const adapter of registry.all()) {
    console.log(`${adapter.displayName.padEnd(14)} ${detected.has(adapter.id) ? "✅ detected" : "⚪ not detected"}`);
  }
  console.log("\nToken efficiency");
  console.log(`RTK            ${rtk.installed ? "✅ available" : "⚪ unavailable"}`);
  console.log(`Repomix        ${repomix.installed ? "✅ available" : "⚪ unavailable"}`);
  console.log(`LLMLingua      ${llm.installed ? "✅ available" : "⚪ unavailable"}`);
  console.log(`Usage provider ${usage.available ? `✅ ${usage.label}` : `⚪ ${usage.label} unavailable`}`);
  console.log("\nSource of truth: OpenSpec");
}
