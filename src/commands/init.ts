import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { commandExists } from "../core/exec.js";
import { writeManagedFile } from "../core/managedFiles.js";
import { createDefaultAgentRegistry } from "../agents/defaultRegistry.js";
import { getRtkStatus } from "../token/rtk.js";
import { getRepomixStatus } from "../token/repomix.js";
import { getDefaultUsageProvider } from "../token/usageProvider.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";
import { installRtk } from "../installers/rtk.js";
import { installRepomix } from "../installers/repomix.js";
import { installCcusage } from "../installers/ccusage.js";
import { installLLMLingua } from "../installers/llmlingua.js";

export const defaultConfig = {
  version: 1,
  tokenOptimization: {
    enabled: true,
    rtk: { enabled: true },
    repomix: { enabled: true },
    llmlingua: {
      enabled: true,
      minimumTokens: 8000,
      targetRatio: 0.5,
      minimumTargetTokens: 4000
    },
    tracking: { enabled: true }
  }
};

async function exists(p: string): Promise<boolean> {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeDefaults<T>(defaults: T, existing: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(existing)) return (existing === undefined ? defaults : existing) as T;
  const merged: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(existing)) {
    const defaultValue = merged[key];
    merged[key] = isPlainObject(defaultValue) && isPlainObject(value) ? mergeDefaults(defaultValue, value) : value;
  }
  return merged as T;
}

function agentInstructions(): string {
  return `# Orch\n\nThis project uses Orch as an orchestration and token-efficiency layer around OpenSpec.\n\nOpenSpec is the ONLY source of truth for specifications, plans, tasks, changes, progress, and archives.\n\nUse the installed Orch workflows/skills when appropriate:\n\n- orch-explore\n- orch-plan\n- orch-execute\n- orch-archive\n\nOrch MUST NOT create competing persistent workflow state.\n\nUse token-efficiency tools only when beneficial. Do not claim a tool was used merely because it is installed, and do not fabricate token savings.\n`;
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${message} [Y/n] `);
    const normalized = answer.trim().toLowerCase();
    return normalized === "" || normalized === "y" || normalized === "yes";
  } finally { rl.close(); }
}

export async function ensureConfig(configPath: string) {
  if (!(await exists(configPath))) {
    await writeFile(configPath, JSON.stringify(defaultConfig, null, 2) + "\n", "utf8");
    return { created: true, updated: false, invalid: false };
  }
  const raw = await readFile(configPath, "utf8");
  let existing: unknown;
  try { existing = JSON.parse(raw); } catch { return { created: false, updated: false, invalid: true }; }
  const merged = mergeDefaults(defaultConfig, existing);
  const next = JSON.stringify(merged, null, 2) + "\n";
  if (next !== raw) {
    await writeFile(configPath, next, "utf8");
    return { created: false, updated: true, invalid: false };
  }
  return { created: false, updated: false, invalid: false };
}

async function writeAgentFiles(cwd: string) {
  const agentsMd = path.join(cwd, "AGENTS.md");
  const agentsExists = await exists(agentsMd);
  if (!agentsExists) await writeFile(agentsMd, agentInstructions(), "utf8");
  const antiFile = path.join(cwd, ".agents", "rules", "orch.md");
  const antiStatus = await writeManagedFile(antiFile, agentInstructions());
  return { agentsMd, agentsCreated: !agentsExists, antiStatus };
}

async function ensureTokenTools() {
  let rtk = await getRtkStatus();
  let repomix = await getRepomixStatus();
  let usage = await getDefaultUsageProvider().status();
  let llm = getLLMLinguaStatus();

  if (!rtk.installed && await confirm("\nRTK not found. Install RTK now?")) {
    const result = await installRtk(); if (!result.success) console.log(`⚠️ ${result.error}`); rtk = await getRtkStatus();
  }
  if (!repomix.installed && await confirm("\nRepomix not found. Install Repomix now?")) {
    const result = await installRepomix(); if (!result.success) console.log(`⚠️ ${result.error}`); repomix = await getRepomixStatus();
  }
  if (!usage.available && await confirm("\nUsage provider not found. Install ccusage as the current provider?")) {
    const result = await installCcusage(); if (!result.success) console.log(`⚠️ ${result.error}`); usage = await getDefaultUsageProvider().status();
  }
  if (!llm.installed && await confirm("\nLLMLingua not found (optional). Install now?")) {
    const result = await installLLMLingua(); if (!result.success) console.log(`⚠️ ${result.error}`); llm = getLLMLinguaStatus();
  }
  return { rtk, repomix, usage, llm };
}

function managedIcon(status: string) {
  return status === "skipped-user-file" ? "⚠️" : status === "unchanged" ? "ℹ️" : "✅";
}

export async function initCommand(cwd = process.cwd()) {
  console.log("ORCH Init");
  console.log("────────────────────────────────");

  const orchDir = path.join(cwd, ".orch");
  await mkdir(orchDir, { recursive: true });
  const configPath = path.join(orchDir, "config.json");
  const configResult = await ensureConfig(configPath);
  const openspecProject = await exists(path.join(cwd, "openspec"));
  const openspecCli = await commandExists("openspec", ["--version"]);
  const agentFiles = await writeAgentFiles(cwd);
  const registry = createDefaultAgentRegistry();
  const integrations = await registry.installAll(cwd);
  const { rtk, repomix, usage, llm } = await ensureTokenTools();

  if (configResult.invalid) console.log(`⚠️ Invalid Orch config preserved: ${configPath}`);
  else if (configResult.created) console.log(`✅ Orch config created: ${configPath}`);
  else if (configResult.updated) console.log(`✅ Orch config merged with missing defaults: ${configPath}`);
  else console.log(`ℹ️ Orch config already current: ${configPath}`);

  console.log(`${agentFiles.agentsCreated ? "✅" : "ℹ️"} AGENTS.md ${agentFiles.agentsCreated ? "created" : "preserved"}`);
  console.log(`${managedIcon(agentFiles.antiStatus)} Antigravity rule: ${agentFiles.antiStatus}`);

  console.log("\nAgent integrations");
  for (const { adapter, results } of integrations) {
    for (const item of results) console.log(`${managedIcon(item.status)} ${adapter.displayName} ${item.name}: ${item.status}`);
  }

  console.log("");
  if (openspecCli.installed && openspecProject) console.log("✅ OpenSpec: initialized");
  else if (openspecCli.installed) console.log("⚠️ OpenSpec CLI found; run `openspec init` in this project.");
  else console.log("❌ OpenSpec CLI not detected; install OpenSpec before using Orch workflows.");

  console.log("\nToken tooling");
  console.log(`${rtk.installed ? "✅" : "⚪"} RTK${rtk.version ? ` — ${rtk.version}` : ""}`);
  console.log(`${repomix.installed ? "✅" : "⚪"} Repomix${repomix.version ? ` — ${repomix.version}` : ""}`);
  console.log(`${llm.installed ? "✅" : "⚪"} LLMLingua${llm.installed ? ` — ${llm.python}` : " — optional"}`);
  console.log(`${usage.available ? "✅" : "⚪"} Usage provider: ${usage.label}${usage.version ? ` — ${usage.version}` : ""}`);
  console.log(`\n🧠 Token Efficiency: ${rtk.installed || repomix.installed || llm.installed ? "ACTIVE" : "INACTIVE"}`);
  console.log("OpenSpec remains the only source of truth.");
}
