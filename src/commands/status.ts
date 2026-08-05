import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { commandExists } from "../core/exec.js";
import { getRtkStatus } from "../token/rtk.js";
import { getRepomixStatus } from "../token/repomix.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";
import { getDefaultUsageProvider } from "../token/usageProvider.js";

export async function statusCommand(cwd = process.cwd()) {
  const configPath = path.join(cwd, ".orch", "config.json");
  const openspecDir = path.join(cwd, "openspec");
  const codexDir = path.join(cwd, ".codex", "skills", "orch-plan");
  const antigravityDir = path.join(cwd, ".agents", "workflows");

  let configState = "missing";
  if (existsSync(configPath)) {
    try {
      JSON.parse(readFileSync(configPath, "utf8"));
      configState = "valid";
    } catch {
      configState = "invalid";
    }
  }

  const openspecCli = await commandExists("openspec", ["--version"]);
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
  console.log("");
  console.log("Integrations");
  console.log(`Codex          ${existsSync(codexDir) ? "✅ installed" : "⚪ not installed"}`);
  console.log(`Antigravity    ${existsSync(antigravityDir) ? "✅ installed" : "⚪ not installed"}`);
  console.log("");
  console.log("Token efficiency");
  console.log(`RTK            ${rtk.installed ? "✅ available" : "⚪ unavailable"}`);
  console.log(`Repomix        ${repomix.installed ? "✅ available" : "⚪ unavailable"}`);
  console.log(`LLMLingua      ${llm.installed ? "✅ available" : "⚪ unavailable"}`);
  console.log(`Usage provider ${usage.available ? `✅ ${usage.label}` : `⚪ ${usage.label} unavailable`}`);
  console.log("");
  console.log("Source of truth: OpenSpec");
}
