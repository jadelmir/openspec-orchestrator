import { commandExists } from "../core/exec.js";
import { getRtkStatus } from "../token/rtk.js";
import { getRepomixStatus } from "../token/repomix.js";
import { getCcusageStatus } from "../token/ccusage.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";

function line(ok: boolean, name: string, detail?: string) {
  const icon = ok ? "✅" : "⚠️";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

export async function doctorCommand() {
  console.log("ORCH Doctor");
  console.log("────────────────────────────────");

  const node = await commandExists("node", ["--version"]);
  const git = await commandExists("git", ["--version"]);
  const openspec = await commandExists("openspec", ["--version"]);
  const rtk = await getRtkStatus();
  const repomix = await getRepomixStatus();
  const ccusage = await getCcusageStatus();
  const llm = getLLMLinguaStatus();

  line(node.installed, "Node.js", node.version);
  line(git.installed, "Git", git.version);
  line(openspec.installed, "OpenSpec", openspec.version);
  line(rtk.installed, "RTK", rtk.version);
  line(repomix.installed, "Repomix", repomix.version);
  line(ccusage.installed, "ccusage", ccusage.version);
  line(llm.installed, "LLMLingua", llm.installed ? llm.python : "optional");

  const optimizationActive =
    rtk.installed || repomix.installed || llm.installed;

  console.log("");
  console.log(
    `🧠 Token Efficiency: ${optimizationActive ? "ACTIVE" : "INACTIVE"}`
  );
}
