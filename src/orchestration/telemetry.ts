import type { OrchRunMetrics } from "../token/runMetrics.js";
import { addRoutingMetric } from "../token/runMetrics.js";
import type { RoutingDecision } from "./router.js";
import type { WorkUnit } from "./workUnit.js";

export interface WorkUnitUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export function recordRoutingTelemetry(
  metrics: OrchRunMetrics,
  workUnit: WorkUnit,
  decision: RoutingDecision,
  usage: WorkUnitUsage = {}
): void {
  addRoutingMetric(metrics, {
    workUnitId: workUnit.id,
    sourceTaskRef: workUnit.sourceTaskRef,
    agentId: decision.agentId,
    requestedTier: decision.requestedTier,
    executionTier: decision.executionTier,
    tierEnforced: decision.tierEnforced,
    contextStrategy: decision.contextStrategy,
    parallelGroup: decision.parallelGroup,
    reasons: decision.reasons,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens
  });
}
