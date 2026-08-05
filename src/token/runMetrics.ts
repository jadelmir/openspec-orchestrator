import { getCcusageStatus } from "./ccusage.js";

export type ToolRunStatus = "available" | "used" | "skipped" | "unavailable" | "failed";

export interface ToolRunMetric {
  status: ToolRunStatus;
  reason?: string;
  beforeTokens?: number;
  afterTokens?: number;
  savedTokens?: number;
  reductionPercent?: number;
  error?: string;
}

export interface RoutingRunMetric {
  workUnitId: string;
  sourceTaskRef: string;
  agentId: string;
  requestedTier: string;
  executionTier: string;
  tierEnforced: boolean;
  contextStrategy: string;
  parallelGroup?: string;
  reasons: string[];
  inputTokens?: number;
  outputTokens?: number;
}

export interface OrchRunMetrics {
  workflow: string;
  startedAt: string;
  finishedAt?: string;
  rtk: ToolRunMetric;
  repomix: ToolRunMetric;
  llmlingua: ToolRunMetric;
  ccusage: ToolRunMetric;
  contextBeforeTokens?: number;
  contextAfterTokens?: number;
  runSavedTokens: number;
  projectSavedTokens?: number;
  routing?: RoutingRunMetric[];
}

export function createRunMetrics(workflow: string): OrchRunMetrics {
  return {
    workflow,
    startedAt: new Date().toISOString(),
    rtk: { status: "unavailable" },
    repomix: { status: "unavailable" },
    llmlingua: { status: "unavailable" },
    ccusage: { status: "unavailable" },
    runSavedTokens: 0,
    routing: []
  };
}

export async function detectCcusageMetric(metrics: OrchRunMetrics): Promise<void> {
  const status = await getCcusageStatus();
  if (status.installed) {
    metrics.ccusage.status = "available";
    metrics.ccusage.reason = "Usage tracking available through npx ccusage@latest";
  } else {
    metrics.ccusage.status = "unavailable";
    metrics.ccusage.reason = status.error ?? "ccusage unavailable through npx";
  }
}

export function addRoutingMetric(metrics: OrchRunMetrics, routing: RoutingRunMetric): void {
  metrics.routing ??= [];
  metrics.routing.push(routing);
}

export function markToolAvailable(metric: ToolRunMetric, reason?: string): void {
  metric.status = "available";
  if (reason) metric.reason = reason;
}

export function markToolUsed(metric: ToolRunMetric, data?: { beforeTokens?: number; afterTokens?: number; savedTokens?: number; reductionPercent?: number; reason?: string; }): void {
  metric.status = "used";
  if (data?.beforeTokens !== undefined) metric.beforeTokens = data.beforeTokens;
  if (data?.afterTokens !== undefined) metric.afterTokens = data.afterTokens;
  if (data?.savedTokens !== undefined) metric.savedTokens = Math.max(0, data.savedTokens);
  if (data?.reductionPercent !== undefined) metric.reductionPercent = data.reductionPercent;
  if (data?.reason) metric.reason = data.reason;
}

export function markToolSkipped(metric: ToolRunMetric, reason: string): void {
  metric.status = "skipped";
  metric.reason = reason;
}

export function markToolFailed(metric: ToolRunMetric, error: string): void {
  metric.status = "failed";
  metric.error = error;
  metric.reason = error;
}

export function finalizeRunMetrics(metrics: OrchRunMetrics, projectSavedTokens?: number): OrchRunMetrics {
  metrics.finishedAt = new Date().toISOString();
  let runSaved = 0;
  for (const metric of [metrics.rtk, metrics.repomix, metrics.llmlingua]) {
    if (metric.status === "used" && metric.savedTokens !== undefined && Number.isFinite(metric.savedTokens)) {
      runSaved += Math.max(0, metric.savedTokens);
    }
  }
  metrics.runSavedTokens = runSaved;
  if (projectSavedTokens !== undefined) metrics.projectSavedTokens = projectSavedTokens;
  return metrics;
}
