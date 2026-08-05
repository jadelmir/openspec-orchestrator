import type { AgentAdapter, ExecutionTier } from "../agents/types.js";
import { AgentRegistry } from "../agents/registry.js";
import type { WorkUnit } from "./workUnit.js";

export type ContextStrategy = "targeted" | "repomix" | "repomix+compression";

export interface RoutingDecision {
  workUnitId: string;
  agentId: string;
  executionTier: ExecutionTier;
  requestedTier: ExecutionTier;
  tierEnforced: boolean;
  contextStrategy: ContextStrategy;
  parallelGroup?: string;
  reasons: string[];
}

export interface RoutingOptions {
  preferredAgentId?: string;
  contextStrategy?: ContextStrategy;
}

export function requiredCapabilities(workUnit: WorkUnit) {
  return {
    readRepository: true,
    ...(workUnit.requiresWrites ? { writeRepository: true } : {}),
    ...(workUnit.requiresCommands ? { runCommands: true } : {})
  };
}

export function chooseExecutionTier(workUnit: WorkUnit): ExecutionTier {
  if (workUnit.risk === "high" || workUnit.complexity === "large") return "strong";
  if (workUnit.risk === "low" && workUnit.complexity === "small") return "lightweight";
  return "default";
}

export function routeWorkUnit(
  registry: AgentRegistry,
  workUnit: WorkUnit,
  candidates: AgentAdapter[],
  options: RoutingOptions = {}
): RoutingDecision {
  const capable = registry.filterByCapabilities(candidates, requiredCapabilities(workUnit));
  if (!capable.length) {
    throw new Error(`No capable agent exists for work unit ${workUnit.id}.`);
  }

  const reasons: string[] = [];
  let selected = capable[0];

  if (options.preferredAgentId) {
    const preferred = capable.find((adapter) => adapter.id === options.preferredAgentId);
    if (preferred) {
      selected = preferred;
      reasons.push(`Selected explicitly preferred capable agent: ${preferred.displayName}.`);
    } else {
      reasons.push(`Preferred agent ${options.preferredAgentId} was unavailable or lacked required capabilities.`);
    }
  }

  if (!reasons.some((reason) => reason.startsWith("Selected"))) {
    selected = [...capable].sort((a, b) => a.id.localeCompare(b.id))[0];
    reasons.push(`Selected deterministic first capable agent: ${selected.displayName}.`);
  }

  const requestedTier = chooseExecutionTier(workUnit);
  const supported = selected.capabilities().executionTiers ?? [];
  const tierEnforced = supported.includes(requestedTier);
  const executionTier = tierEnforced ? requestedTier : "default";

  reasons.push(
    tierEnforced
      ? `Execution tier ${requestedTier} is supported by ${selected.displayName}.`
      : `Execution tier ${requestedTier} is advisory; ${selected.displayName} will use its default execution behavior.`
  );

  return {
    workUnitId: workUnit.id,
    agentId: selected.id,
    requestedTier,
    executionTier,
    tierEnforced,
    contextStrategy: options.contextStrategy ?? "targeted",
    reasons
  };
}
