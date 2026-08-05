import { commandExists } from "../core/exec.js";
import { createDefaultAgentRegistry } from "../agents/defaultRegistry.js";
import { getRtkStatus } from "../token/rtk.js";
import { getRepomixStatus } from "../token/repomix.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";
import { getDefaultUsageProvider } from "../token/usageProvider.js";

function line(kind: "required" | "optional", ok: boolean, name: string, detail?: string, fix?: string) {
  const icon = ok ? "✅" : kind === "required" ? "❌" : "⚠️";
  console.log(`${icon} ${name} [${kind}]${detail ? ` — ${detail}` : ""}`);
  if (!ok && fix) console.log(`   Fix: ${fix}`);
}

export async function doctorCommand(cwd = process.cwd()) {
  console.log("ORCH Doctor");
  console.log("────────────────────────────────");

  const node = await commandExists("node", ["--version"]);
  const git = await commandExists("git", ["--version"]);
  const openspec = await commandExists("openspec", ["--version"]);
  const registry = createDefaultAgentRegistry();
  const detected = new Set((await registry.detected(cwd)).map((adapter) => adapter.id));
  const rtk = await getRtkStatus();
  const repomix = await getRepomixStatus();
  const llm = getLLMLinguaStatus();
  const usage = await getDefaultUsageProvider().status();

  line("required", node.installed, "Node.js", node.version || node.error, "Install Node.js 20 or newer.");
  line("required", git.installed, "Git", git.version || git.error, "Install Git and ensure it is on PATH.");
  line("required", openspec.installed, "OpenSpec", openspec.version || openspec.error, "Install OpenSpec before using Orch workflows.");

  for (const adapter of registry.all()) {
    line("optional", detected.has(adapter.id), adapter.displayName, detected.has(adapter.id) ? "integration detected" : "integration not detected", "Run orch init to install supported Orch assets.");
  }

  line("optional", rtk.installed, "RTK", rtk.version || rtk.error, "Run orch init and choose RTK installation.");
  line("optional", repomix.installed, "Repomix", repomix.version || repomix.error, "Run orch init and choose Repomix installation.");
  line("optional", llm.installed, "LLMLingua", llm.installed ? llm.python : "not installed", "Install only if you want large-context compression.");
  line("optional", usage.available, usage.label, usage.version || usage.detail, "Install/configure a supported usage provider if you want usage visibility.");

  const requiredHealthy = node.installed && git.installed && openspec.installed;
  const optimizationActive = rtk.installed || repomix.installed || llm.installed;
  console.log(`\nCore health: ${requiredHealthy ? "✅ READY" : "❌ NEEDS ATTENTION"}`);
  console.log(`🧠 Token Efficiency: ${optimizationActive ? "ACTIVE" : "INACTIVE"}`);
}
