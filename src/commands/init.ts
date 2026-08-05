import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { commandExists } from "../core/exec.js";
import { getRtkStatus } from "../token/rtk.js";
import { getRepomixStatus } from "../token/repomix.js";
import { getCcusageStatus } from "../token/ccusage.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";
import { installRtk } from "../installers/rtk.js";
import { installRepomix } from "../installers/repomix.js";
import { installCcusage } from "../installers/ccusage.js";
import { installLLMLingua } from "../installers/llmlingua.js";
import { installCodexSkills } from "../agents/codex.js";
import { installAntigravityWorkflows } from "../agents/antigravity.js";

const defaultConfig = {
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
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeDefaults<T>(defaults: T, existing: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(existing)) {
    return (existing === undefined ? defaults : existing) as T;
  }

  const merged: Record<string, unknown> = { ...defaults };

  for (const [key, value] of Object.entries(existing)) {
    const defaultValue = merged[key];
    merged[key] =
      isPlainObject(defaultValue) && isPlainObject(value)
        ? mergeDefaults(defaultValue, value)
        : value;
  }

  return merged as T;
}

function agentInstructions(): string {
  return `# Orch\n\nThis project uses Orch as an orchestration and token-efficiency layer around OpenSpec.\n\nOpenSpec is the ONLY source of truth for specifications, plans, tasks, changes, progress, and archives.\n\nUse the installed Orch workflows/skills when appropriate:\n\n- orch-explore\n- orch-plan\n- orch-execute\n- orch-archive\n\nOrch MUST NOT create competing persistent workflow state.\n\nUse token-efficiency tools only when they are beneficial. Do not claim a tool was used merely because it is installed, and do not fabricate token savings.\n`;
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });

  try {
    const answer = await rl.question(`${message} [Y/n] `);
    const normalized = answer.trim().toLowerCase();
    return normalized === "" || normalized === "y" || normalized === "yes";
  } finally {
    rl.close();
  }
}

async function ensureConfig(configPath: string) {
  if (!(await exists(configPath))) {
    await writeFile(
      configPath,
      JSON.stringify(defaultConfig, null, 2) + "\n",
      "utf8"
    );
    return { created: true, updated: false };
  }

  const raw = await readFile(configPath, "utf8");

  let existing: unknown;
  try {
    existing = JSON.parse(raw);
  } catch {
    console.log(`⚠️ Existing Orch config is invalid JSON and was preserved: ${configPath}`);
    return { created: false, updated: false, invalid: true };
  }

  const merged = mergeDefaults(defaultConfig, existing);
  const next = JSON.stringify(merged, null, 2) + "\n";

  if (next !== raw) {
    await writeFile(configPath, next, "utf8");
    return { created: false, updated: true };
  }

  return { created: false, updated: false };
}

async function writeAgentFiles(cwd: string) {
  const agentsMd = path.join(cwd, "AGENTS.md");
  const agentsExists = await exists(agentsMd);

  if (!agentsExists) {
    await writeFile(agentsMd, agentInstructions(), "utf8");
  }

  const antiDir = path.join(cwd, ".agents", "rules");
  await mkdir(antiDir, { recursive: true });
  const antiFile = path.join(antiDir, "orch.md");

  // Orch owns this generated rule file, so refreshing it is intentional.
  await writeFile(antiFile, agentInstructions(), "utf8");

  return { agentsMd, antiFile, agentsCreated: !agentsExists };
}

async function ensureTokenTools() {
  let rtk = await getRtkStatus();
  let repomix = await getRepomixStatus();
  let ccusage = await getCcusageStatus();
  let llm = getLLMLinguaStatus();

  if (!rtk.installed) {
    console.log("\n⚠️ RTK not found.");
    console.log("RTK reduces verbose shell, git, test, and build output.");
    if (await confirm("Install RTK now?")) {
      const result = await installRtk();
      if (!result.success) console.log(`⚠️ ${result.error}`);
      rtk = await getRtkStatus();
    }
  }

  if (!repomix.installed) {
    console.log("\n⚠️ Repomix not found.");
    console.log("Repomix creates compact AI-friendly repository context.");
    if (await confirm("Install Repomix now?")) {
      const result = await installRepomix();
      console.log(result.success ? "✅ Repomix installed." : `⚠️ Repomix installation failed: ${result.error}`);
      repomix = await getRepomixStatus();
    }
  }

  if (!ccusage.installed) {
    console.log("\n⚠️ ccusage not found.");
    console.log("ccusage provides token-usage visibility when supported.");
    if (await confirm("Install ccusage globally?")) {
      const result = await installCcusage();
      console.log(result.success ? "✅ ccusage installed." : `⚠️ ccusage installation failed: ${result.error}`);
      ccusage = await getCcusageStatus();
    }
  }

  if (!llm.installed) {
    console.log("\n⚠️ LLMLingua not found.");
    console.log("LLMLingua optionally compresses very large context and requires Python.");
    if (await confirm("Install LLMLingua now?")) {
      const result = await installLLMLingua();
      console.log(result.success ? "✅ LLMLingua installed." : `⚠️ LLMLingua installation failed: ${result.error}`);
      llm = getLLMLinguaStatus();
    }
  }

  return { rtk, repomix, ccusage, llm };
}

export async function initCommand(cwd = process.cwd()) {
  console.log("ORCH Init");
  console.log("────────────────────────────────");

  const orchDir = path.join(cwd, ".orch");
  await mkdir(orchDir, { recursive: true });

  const configPath = path.join(orchDir, "config.json");
  const configResult = await ensureConfig(configPath);

  const openspecDir = path.join(cwd, "openspec");
  const openspecProject = await exists(openspecDir);
  const openspecCli = await commandExists("openspec", ["--version"]);

  const agentFiles = await writeAgentFiles(cwd);
  const codexSkills = await installCodexSkills(cwd);
  const antigravityWorkflows = await installAntigravityWorkflows(cwd);
  const { rtk, repomix, ccusage, llm } = await ensureTokenTools();

  if (configResult.created) {
    console.log(`✅ Orch config created: ${configPath}`);
  } else if (configResult.updated) {
    console.log(`✅ Orch config updated with missing defaults; existing values preserved: ${configPath}`);
  } else if (!configResult.invalid) {
    console.log(`ℹ️ Orch config already initialized; existing values preserved: ${configPath}`);
  }

  console.log(`${agentFiles.agentsCreated ? "✅" : "ℹ️"} Codex/generic instructions: ${agentFiles.agentsMd}${agentFiles.agentsCreated ? "" : " (existing AGENTS.md preserved)"}`);
  console.log(`✅ Orch-managed Antigravity rule refreshed: ${agentFiles.antiFile}`);

  console.log("\nAgent integrations");
  console.log("────────────────────────────────");
  for (const skill of codexSkills) console.log(`✅ Codex skill: ${skill}`);
  for (const workflow of antigravityWorkflows) console.log(`✅ Antigravity workflow: /${workflow}`);

  console.log("");
  if (openspecCli.installed && openspecProject) {
    console.log("✅ OpenSpec: initialized");
  } else if (openspecCli.installed) {
    console.log("⚠️ OpenSpec CLI found, but this project is not initialized.");
    console.log("   Run: openspec init");
  } else {
    console.log("⚠️ OpenSpec CLI not detected.");
    console.log("   Install/initialize OpenSpec before using Orch workflows.");
  }

  console.log("\nToken tooling");
  console.log("────────────────────────────────");
  console.log(`${rtk.installed ? "✅" : "⚠️"} RTK${rtk.version ? ` — ${rtk.version}` : ""}`);
  console.log(`${repomix.installed ? "✅" : "⚠️"} Repomix${repomix.version ? ` — ${repomix.version}` : ""}`);
  console.log(`${ccusage.installed ? "✅" : "⚠️"} ccusage${ccusage.version ? ` — ${ccusage.version}` : ""}`);
  console.log(`${llm.installed ? "✅" : "⚠️"} LLMLingua${llm.installed ? ` — ${llm.python}` : " — optional"}`);

  const active = rtk.installed || repomix.installed || llm.installed;
  console.log("");
  console.log(`🧠 Token Efficiency: ${active ? "ACTIVE" : "INACTIVE"}`);
  console.log("OpenSpec remains the only source of truth.");
}
