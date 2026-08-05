import { AgentRegistry } from "./registry.js";
import { CodexAdapter } from "./codex.js";
import { AntigravityAdapter } from "./antigravity.js";

export function createDefaultAgentRegistry(): AgentRegistry {
  return new AgentRegistry([
    new CodexAdapter(),
    new AntigravityAdapter()
  ]);
}
