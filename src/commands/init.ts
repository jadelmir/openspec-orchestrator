import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { commandExists } from "../core/exec.js";
import { getRtkStatus } from "../token/rtk.js";
import { getRepomixStatus } from "../token/repomix.js";
import { getCcusageStatus } from "../token/ccusage.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { installRtk } from "../installers/rtk.js";
import { installRepomix } from "../installers/repomix.js";
import { installCcusage } from "../installers/ccusage.js";
import { installLLMLingua } from "../installers/llmlingua.js";
import { installCodexSkills } from "../agents/codex.js";
import { installAntigravityWorkflows } from "../agents/antigravity.js";

let rtk = await getRtkStatus();
let repomix = await getRepomixStatus();
let ccusage = await getCcusageStatus();
let llm = getLLMLinguaStatus();

if (!rtk.installed) {
  console.log("");
  console.log("⚠️ RTK not found.");
  console.log("RTK reduces verbose shell, git, test, and build output.");

  if (await confirm("Install RTK now?")) {
    const result = await installRtk();

    if (!result.success) {
      console.log(`⚠️ ${result.error}`);
    }

    rtk = await getRtkStatus();
  }
}

if (!repomix.installed) {
  console.log("");
  console.log("⚠️ Repomix not found.");
  console.log("Repomix creates compact AI-friendly repository context.");

  if (await confirm("Install Repomix now?")) {
    console.log("Installing Repomix...");

    const result = await installRepomix();

    if (result.success) {
      console.log("✅ Repomix installed.");
    } else {
      console.log(`⚠️ Repomix installation failed: ${result.error}`);
    }

    repomix = await getRepomixStatus();
  }
}

if (!ccusage.installed) {
  console.log("");
  console.log("⚠️ ccusage not found.");
  console.log("ccusage tracks Codex token usage and estimated cost.");

  if (await confirm("Install ccusage globally?")) {
    console.log("Installing ccusage...");

    const result = await installCcusage();

    if (result.success) {
      console.log("✅ ccusage installed.");
    } else {
      console.log(`⚠️ ccusage installation failed: ${result.error}`);
    }

    ccusage = await getCcusageStatus();
  }
}

if (!llm.installed) {
  console.log("");
  console.log("⚠️ LLMLingua not found.");
  console.log(
    "LLMLingua optionally compresses very large context and requires Python."
  );

  if (await confirm("Install LLMLingua now?")) {
    console.log("Installing LLMLingua...");

    const result = await installLLMLingua();

    if (result.success) {
      console.log("✅ LLMLingua installed.");
    } else {
      console.log(`⚠️ LLMLingua installation failed: ${result.error}`);
    }

    llm = getLLMLinguaStatus();
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function agentInstructions(): string {
  return `# Orch

This project uses Orch as an orchestration and token-efficiency layer.

OpenSpec is the ONLY source of truth for specifications, plans, tasks, changes, and archives.

Use the installed Orch workflows/skills when appropriate:

- orch-explore
- orch-plan
- orch-execute
- orch-archive

Follow the installed Orch agent workflow instructions.

Token efficiency MUST be used when available.
`;
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

async function writeAgentFiles(cwd: string) {
  const agentsMd = path.join(cwd, "AGENTS.md");
  const agentsExists = await exists(agentsMd);
  if (!agentsExists) {
    await writeFile(agentsMd, agentInstructions(), "utf8");
  }

  const antiDir = path.join(cwd, ".agents", "rules");
  await mkdir(antiDir, { recursive: true });
  const antiFile = path.join(antiDir, "orch.md");
  await writeFile(antiFile, agentInstructions(), "utf8");

  return { agentsMd, antiFile, agentsCreated: !agentsExists };
}

export async function initCommand(cwd = process.cwd()) {
  console.log("ORCH Init");
  console.log("────────────────────────────────");

  const orchDir = path.join(cwd, ".orch");
  await mkdir(orchDir, { recursive: true });

  const config = {
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

  const configPath = path.join(orchDir, "config.json");
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");

  const openspecDir = path.join(cwd, "openspec");
  const openspecProject = await exists(openspecDir);
  const openspecCli = await commandExists("openspec", ["--version"]);

  const agentFiles = await writeAgentFiles(cwd);

  const rtk = await getRtkStatus();
  const repomix = await getRepomixStatus();
  const ccusage = await getCcusageStatus();
  const llm = getLLMLinguaStatus();

  const codexSkills = await installCodexSkills(cwd);
  const antigravityWorkflows = await installAntigravityWorkflows(cwd);

  console.log(`✅ Orch config: ${configPath}`);
  console.log(`${agentFiles.agentsCreated ? "✅" : "ℹ️"} Codex/generic instructions: ${agentFiles.agentsMd}${agentFiles.agentsCreated ? "" : " (existing AGENTS.md preserved)"}`);
  console.log(`✅ Antigravity rules: ${agentFiles.antiFile}`);
  console.log("");
  console.log("Agent integrations");
  console.log("────────────────────────────────");

  for (const skill of codexSkills) {
    console.log(`✅ Codex skill: ${skill}`);
  }

  for (const workflow of antigravityWorkflows) {
    console.log(`✅ Antigravity workflow: /${workflow}`);
  }

  console.log("");

  if (openspecCli.installed && openspecProject) {
    console.log("✅ OpenSpec: initialized");
  } else if (openspecCli.installed && !openspecProject) {
    console.log("⚠️ OpenSpec CLI found, but this project is not initialized.");
    console.log("   Run: openspec init");
  } else {
    console.log("⚠️ OpenSpec CLI not detected.");
    console.log("   Install/initialize OpenSpec before using Orch workflows.");
  }
  
  console.log("");
  console.log("Token tooling");
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
